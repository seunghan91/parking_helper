/**
 * 주차장 데이터 API 통합 모듈
 * 한국교통안전공단 및 기타 주차장 데이터 소스 관리
 */

import { createClient } from '@supabase/supabase-js';

// ========================================
// 타입 정의
// ========================================

export interface KoroadsParking {
  parklot_id: string; // 주차장 ID
  parklot_name: string; // 주차장명
  parklot_tel: string; // 전화번호
  parklot_addr: string; // 주소
  addr_detail: string; // 상세주소
  lat: number; // 위도
  lon: number; // 경도
  place_type: string; // 주차장 유형 (공공/민간/노외)
  parking_fee: string; // 요금정보
  operation_rule: string; // 운영규칙
  period_type: string; // 운영기간 유형
  operation_start_time: string; // 운영시작시간 (HHMM)
  operation_end_time: string; // 운영종료시간 (HHMM)
  weekend_start_time?: string; // 주말운영시작시간
  weekend_end_time?: string; // 주말운영종료시간
  car_type: string; // 차량유형
  capacity: number; // 수용가능대수
  weekend_fee_yn: string; // 주말요금여부
  max_stay_time: string; // 최대주차시간
  holiday_fee_yn: string; // 휴일요금여부
  closed_day: string; // 정기휴무일
}

export interface ParkingLot {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string; // 'public' | 'private' | 'affiliate'
  price_info?: {
    unit?: string;
    price?: number;
    description?: string;
  };
  phone?: string;
  operation_hours?: {
    start: string;
    end: string;
  };
  capacity?: number;
  source_type: string; // 'koroads' | 'seoul' | 'kakao'
  external_id: string; // 소스별 ID
}

export interface BatchResult {
  batch_type: string;
  source_type: string;
  status: 'success' | 'partial' | 'failed';
  total_records: number;
  inserted_count: number;
  updated_count: number;
  failed_count: number;
  error_message?: string;
  duration_ms: number;
}

// ========================================
// 한국교통안전공단 API 클라이언트
// ========================================

export class KoroadsApiClient {
  private baseUrl = 'https://api.koroad.or.kr/openapi';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 전체 주차장 데이터 조회 (페이징)
   * API 명세: https://api.koroad.or.kr/openapi
   */
  async getAllParkings(pageNo: number = 1, pageSize: number = 100): Promise<{
    data: KoroadsParking[];
    totalCount: number;
    pageNo: number;
    pageSize: number;
  }> {
    const url = new URL(`${this.baseUrl}/parkinglot`);
    url.searchParams.append('apiKey', this.apiKey);
    url.searchParams.append('pageNo', pageNo.toString());
    url.searchParams.append('pageSize', pageSize.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      data: result.response || [],
      totalCount: result.totalCount || 0,
      pageNo,
      pageSize,
    };
  }

  /**
   * 특정 지역의 주차장 검색
   */
  async searchByRegion(region: string): Promise<KoroadsParking[]> {
    const url = new URL(`${this.baseUrl}/parkinglot`);
    url.searchParams.append('apiKey', this.apiKey);
    url.searchParams.append('region', region);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.response || [];
  }

  /**
   * 좌표 반경 내 주차장 검색
   */
  async searchByCoordinates(
    lat: number,
    lon: number,
    radius: number = 1 // km
  ): Promise<KoroadsParking[]> {
    const url = new URL(`${this.baseUrl}/parkinglot`);
    url.searchParams.append('apiKey', this.apiKey);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lon.toString());
    url.searchParams.append('radius', radius.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.response || [];
  }
}

// ========================================
// 주차장 데이터 동기화 서비스
// ========================================

export class ParkingDataService {
  private supabase: ReturnType<typeof createClient>;
  private koroadsClient: KoroadsApiClient;

  constructor(supabaseUrl: string, supabaseKey: string, koroadsApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.koroadsClient = new KoroadsApiClient(koroadsApiKey);
  }

  /**
   * 한국교통안전공단 데이터 전체 동기화 (Daily)
   * 모든 주차장의 기본 정보를 가져와 DB에 저장/업데이트
   */
  async syncKoroadsDaily(): Promise<BatchResult> {
    const startTime = Date.now();
    const logData = {
      batch_type: 'daily_full_sync',
      source_type: 'koroads',
      status: 'running' as const,
      total_records: 0,
      inserted_count: 0,
      updated_count: 0,
      failed_count: 0,
    };

    try {
      let pageNo = 1;
      let totalRecords = 0;
      let totalProcessed = 0;

      // 페이징으로 전체 데이터 조회
      while (true) {
        console.log(`[Koroads Sync] Page ${pageNo}...`);
        const result = await this.koroadsClient.getAllParkings(pageNo, 100);

        if (!result.data || result.data.length === 0) break;

        // 배치 처리 (100개 단위)
        const processed = await this.processParkingBatch(result.data, 'koroads');
        totalRecords += result.data.length;
        totalProcessed += processed.inserted + processed.updated;

        logData.inserted_count += processed.inserted;
        logData.updated_count += processed.updated;
        logData.failed_count += processed.failed;

        console.log(`[Koroads Sync] Page ${pageNo}: ↳ ${processed.inserted} inserted, ${processed.updated} updated, ${processed.failed} failed`);

        // 다음 페이지가 없으면 종료
        if (result.totalCount && pageNo * 100 >= result.totalCount) break;
        pageNo++;

        // Rate limiting (API 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      logData.status = logData.failed_count > 0 ? 'partial' : 'success';
      logData.total_records = totalRecords;

      // 배치 로그 기록
      await this.logBatchExecution(logData);

      return {
        ...logData,
        status: logData.status,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[Koroads Sync] Error:', error);
      logData.status = 'failed';
      logData.total_records = logData.inserted_count + logData.updated_count + logData.failed_count;

      await this.logBatchExecution({
        ...logData,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        ...logData,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 주차장 배치 처리 (생성 또는 업데이트)
   */
  private async processParkingBatch(
    parkings: KoroadsParking[],
    sourceType: string
  ): Promise<{ inserted: number; updated: number; failed: number }> {
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const parking of parkings) {
      try {
        const converted = this.convertKoroadsToParking(parking);

        // 1. 기존 주차장 확인
        const existing = await this.supabase
          .from('parking_sources')
          .select('parking_lot_id')
          .eq('source_type', sourceType)
          .eq('external_id', parking.parklot_id)
          .single();

        if (existing.data) {
          // 기존 주차장 업데이트
          const { error } = await this.supabase
            .from('parking_lots')
            .update({
              name: converted.name,
              address: converted.address,
              latitude: converted.latitude,
              longitude: converted.longitude,
              type: converted.type,
              price_info: converted.price_info,
              last_synced_at: new Date().toISOString(),
              external_data: parking,
            })
            .eq('id', existing.data.parking_lot_id);

          if (error) {
            failed++;
            console.error(`[Koroads Batch] Failed to update parking: ${parking.parklot_id}`, error);
          } else {
            updated++;
          }
        } else {
          // 새로운 주차장 생성
          const { data: newParking, error: insertError } = await this.supabase
            .from('parking_lots')
            .insert({
              name: converted.name,
              address: converted.address,
              latitude: converted.latitude,
              longitude: converted.longitude,
              type: converted.type,
              price_info: converted.price_info,
              source_type: sourceType,
              last_synced_at: new Date().toISOString(),
              external_data: parking,
            })
            .select('id')
            .single();

          if (insertError || !newParking) {
            failed++;
            console.error(`[Koroads Batch] Failed to insert parking: ${parking.parklot_id}`, insertError);
          } else {
            // parking_sources 레코드 생성
            await this.supabase.from('parking_sources').insert({
              parking_lot_id: newParking.id,
              source_type: sourceType,
              external_id: parking.parklot_id,
              external_name: parking.parklot_name,
              raw_data: parking,
              synced_at: new Date().toISOString(),
            });

            inserted++;
          }
        }
      } catch (error) {
        failed++;
        console.error(`[Koroads Batch] Exception processing parking:`, error);
      }
    }

    return { inserted, updated, failed };
  }

  /**
   * 한국교통안전공단 데이터 형식을 내부 형식으로 변환
   */
  private convertKoroadsToParking(koroads: KoroadsParking): ParkingLot {
    // 주차장 유형 매핑
    const typeMap: Record<string, string> = {
      '공공': 'public',
      '민간': 'private',
      '노외': 'public',
      '부설': 'affiliate',
    };

    // 요금 정보 파싱
    const priceInfo = this.parseKoroadsPrice(koroads.parking_fee);

    return {
      name: koroads.parklot_name,
      address: `${koroads.parklot_addr}${koroads.addr_detail ? ' ' + koroads.addr_detail : ''}`,
      latitude: koroads.lat,
      longitude: koroads.lon,
      type: typeMap[koroads.place_type] || 'public',
      price_info: priceInfo,
      phone: koroads.parklot_tel,
      operation_hours: this.parseOperationHours(koroads.operation_start_time, koroads.operation_end_time),
      capacity: koroads.capacity,
      source_type: 'koroads',
      external_id: koroads.parklot_id,
    };
  }

  /**
   * 한국교통안전공단 요금 정보 파싱
   */
  private parseKoroadsPrice(priceStr: string): Record<string, unknown> {
    if (!priceStr) return {};

    // 예시: "10분 1,000원" 또는 "최초 30분 무료, 10분당 1,000원"
    const result: Record<string, unknown> = {
      raw: priceStr,
    };

    // 간단한 파싱 (더 복잡한 로직은 필요 시 추가)
    if (priceStr.includes('무료')) {
      result.free = true;
    }

    return result;
  }

  /**
   * 운영 시간 파싱
   */
  private parseOperationHours(
    startTime: string,
    endTime: string
  ): Record<string, unknown> | undefined {
    if (!startTime || !endTime) return undefined;

    return {
      start: startTime.length === 4 ? `${startTime.slice(0, 2)}:${startTime.slice(2)}` : startTime,
      end: endTime.length === 4 ? `${endTime.slice(0, 2)}:${endTime.slice(2)}` : endTime,
    };
  }

  /**
   * 배치 실행 로그 기록
   */
  private async logBatchExecution(log: any): Promise<void> {
    try {
      const { error } = await this.supabase.from('batch_execution_logs').insert({
        batch_type: log.batch_type,
        source_type: log.source_type,
        status: log.status,
        total_records: log.total_records,
        inserted_count: log.inserted_count,
        updated_count: log.updated_count,
        failed_count: log.failed_count,
        error_message: log.error_message,
        completed_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[Batch Logging] Error:', error);
      }
    } catch (error) {
      console.error('[Batch Logging] Exception:', error);
    }
  }

  /**
   * 가장 최근 배치 실행 상태 조회
   */
  async getLatestBatchStatus(batchType: string) {
    const { data, error } = await this.supabase
      .from('batch_execution_logs')
      .select('*')
      .eq('batch_type', batchType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[Batch Status] Error:', error);
      return null;
    }

    return data;
  }
}
