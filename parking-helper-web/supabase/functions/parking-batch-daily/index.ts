/**
 * Supabase Edge Function: 주차장 일일 배치 동기화
 * 매일 03:00 AM에 pg_cron에서 호출
 *
 * 실행: SELECT net.http_post(url := 'https://...parking-batch-daily', body := '{}');
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.37.0';

// ========================================
// 타입 정의
// ========================================

interface KoroadsParking {
  parklot_id: string;
  parklot_name: string;
  parklot_tel: string;
  parklot_addr: string;
  addr_detail: string;
  lat: number;
  lon: number;
  place_type: string;
  parking_fee: string;
  operation_rule: string;
  operation_start_time: string;
  operation_end_time: string;
  capacity: number;
}

// ========================================
// 한국교통안전공단 API 클라이언트
// ========================================

class KoroadsApi {
  private baseUrl = 'https://api.koroad.or.kr/openapi';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getAllParkings(pageNo: number = 1, pageSize: number = 100) {
    const url = new URL(`${this.baseUrl}/parkinglot`);
    url.searchParams.append('apiKey', this.apiKey);
    url.searchParams.append('pageNo', pageNo.toString());
    url.searchParams.append('pageSize', pageSize.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Koroads API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      data: result.response || [],
      totalCount: result.totalCount || 0,
    };
  }
}

// ========================================
// 메인 배치 함수
// ========================================

async function runParkingBatchDaily() {
  const startTime = Date.now();

  // 환경 변수 설정 확인
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const koroadsApiKey = Deno.env.get('KOROADS_API_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey || !koroadsApiKey) {
    throw new Error('Missing required environment variables');
  }

  // Supabase 클라이언트 초기화 (Service Role Key 사용)
  const supabase = createClient(supabaseUrl, supabaseServiceRroleKey);

  // 한국교통안전공단 API 클라이언트
  const koroads = new KoroadsApi(koroadsApiKey);

  const stats = {
    total_records: 0,
    inserted_count: 0,
    updated_count: 0,
    failed_count: 0,
    error_message: null as string | null,
  };

  try {
    console.log('[Parking Batch Daily] Starting...');

    let pageNo = 1;
    let hasMore = true;

    // 페이징으로 전체 데이터 조회
    while (hasMore) {
      console.log(`[Parking Batch Daily] Fetching page ${pageNo}...`);

      const result = await koroads.getAllParkings(pageNo, 100);
      if (!result.data || result.data.length === 0) {
        hasMore = false;
        break;
      }

      // 배치 처리
      for (const parking of result.data) {
        try {
          await processParkingRecord(supabase, parking);
          stats.inserted_count++;
        } catch (error) {
          stats.failed_count++;
          console.error(`[Parking Batch Daily] Error processing parking ${parking.parklot_id}:`, error);
        }
      }

      stats.total_records += result.data.length;

      // 다음 페이지 확인
      if (result.totalCount && pageNo * 100 >= result.totalCount) {
        hasMore = false;
      } else {
        pageNo++;
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('[Parking Batch Daily] Completed', stats);

    // 배치 로그 기록
    await supabase.from('batch_execution_logs').insert({
      batch_type: 'daily_full_sync',
      source_type: 'koroads',
      status: stats.failed_count === 0 ? 'success' : 'partial',
      total_records: stats.total_records,
      inserted_count: stats.inserted_count,
      updated_count: stats.updated_count,
      failed_count: stats.failed_count,
      error_message: stats.error_message,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    });

    return {
      success: true,
      ...stats,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[Parking Batch Daily] Fatal error:', error);

    stats.error_message = error instanceof Error ? error.message : 'Unknown error';

    // 실패 로그 기록
    try {
      await supabase.from('batch_execution_logs').insert({
        batch_type: 'daily_full_sync',
        source_type: 'koroads',
        status: 'failed',
        total_records: stats.total_records,
        inserted_count: stats.inserted_count,
        updated_count: stats.updated_count,
        failed_count: stats.failed_count,
        error_message: stats.error_message,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      });
    } catch (logError) {
      console.error('[Parking Batch Daily] Failed to log error:', logError);
    }

    return {
      success: false,
      ...stats,
      duration_ms: Date.now() - startTime,
    };
  }
}

// ========================================
// 주차장 레코드 처리
// ========================================

async function processParkingRecord(
  supabase: ReturnType<typeof createClient>,
  parking: KoroadsParking
) {
  // 1. parking_sources에서 기존 주차장 확인
  const { data: existingSource } = await supabase
    .from('parking_sources')
    .select('parking_lot_id')
    .eq('source_type', 'koroads')
    .eq('external_id', parking.parklot_id)
    .single();

  if (existingSource) {
    // 기존 주차장 업데이트
    const { error } = await supabase
      .from('parking_lots')
      .update({
        name: parking.parklot_name,
        address: `${parking.parklot_addr}${parking.addr_detail ? ' ' + parking.addr_detail : ''}`,
        latitude: parking.lat,
        longitude: parking.lon,
        type: mapParkingType(parking.place_type),
        price_info: parsePrice(parking.parking_fee),
        last_synced_at: new Date().toISOString(),
        external_data: parking,
      })
      .eq('id', existingSource.parking_lot_id);

    if (error) {
      throw new Error(`Failed to update parking: ${error.message}`);
    }
  } else {
    // 새로운 주차장 생성
    const { data: newParking, error: insertError } = await supabase
      .from('parking_lots')
      .insert({
        name: parking.parklot_name,
        address: `${parking.parklot_addr}${parking.addr_detail ? ' ' + parking.addr_detail : ''}`,
        latitude: parking.lat,
        longitude: parking.lon,
        type: mapParkingType(parking.place_type),
        price_info: parsePrice(parking.parking_fee),
        source_type: 'koroads',
        last_synced_at: new Date().toISOString(),
        external_data: parking,
        is_active: true,
      })
      .select('id')
      .single();

    if (insertError || !newParking) {
      throw new Error(`Failed to insert parking: ${insertError?.message || 'Unknown error'}`);
    }

    // parking_sources 레코드 생성
    const { error: sourceError } = await supabase.from('parking_sources').insert({
      parking_lot_id: newParking.id,
      source_type: 'koroads',
      external_id: parking.parklot_id,
      external_name: parking.parklot_name,
      raw_data: parking,
      synced_at: new Date().toISOString(),
    });

    if (sourceError) {
      throw new Error(`Failed to insert parking source: ${sourceError.message}`);
    }
  }
}

// ========================================
// 헬퍼 함수
// ========================================

function mapParkingType(koroadsType: string): string {
  const typeMap: Record<string, string> = {
    '공공': 'public',
    '민간': 'private',
    '노외': 'public',
    '부설': 'affiliate',
  };
  return typeMap[koroadsType] || 'public';
}

function parsePrice(priceStr: string): Record<string, any> {
  const result: Record<string, any> = { raw: priceStr };

  if (!priceStr) return result;

  if (priceStr.includes('무료')) {
    result.free = true;
  }

  // 더 복잡한 파싱 로직은 필요 시 추가

  return result;
}

// ========================================
// HTTP 핸들러
// ========================================

serve(async (req: Request) => {
  // CORS 헤더
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await runParkingBatchDaily();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Parking Batch Daily] Handler error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
