import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '1000' // meters
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')

  try {
    const supabase = await createClient()

    let query = supabase
      .from('parking_lots')
      .select(`
        id,
        name,
        address,
        latitude,
        longitude,
        type,
        price_info,
        place:places(name)
      `)
      .limit(limit)

    // 텍스트 검색
    if (q) {
      query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`)
    }

    // 위치 기반 검색 (간단한 버전 - 실제로는 PostGIS 사용 권장)
    if (lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radiusKm = parseFloat(radius) / 1000
      
      // 대략적인 위도/경도 범위 계산
      const latDelta = radiusKm / 111 // 1도 ≈ 111km
      const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180))
      
      query = query
        .gte('latitude', latNum - latDelta)
        .lte('latitude', latNum + latDelta)
        .gte('longitude', lngNum - lngDelta)
        .lte('longitude', lngNum + lngDelta)
    }

    // 커서 페이지네이션
    if (cursor) {
      query = query.gt('id', cursor)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: error.message } },
        { status: 500 }
      )
    }

    const response = {
      data: data || [],
      page: {
        next_cursor: data && data.length === limit ? data[data.length - 1].id : null
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}