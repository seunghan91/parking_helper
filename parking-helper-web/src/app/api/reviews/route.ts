import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const parking_lot_id = searchParams.get('parking_lot_id')
  const place_id = searchParams.get('place_id')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '500' // meters
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')
  const sort = searchParams.get('sort') || 'created_desc'

  try {
    const supabase = await createClient()

    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles(nickname),
        parking_lot:parking_lots(name),
        place:places(name)
      `)
      .limit(limit)

    // 필터링
    if (parking_lot_id) {
      query = query.eq('parking_lot_id', parking_lot_id)
    } else if (place_id) {
      query = query.eq('place_id', place_id)
    } else if (lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radiusKm = parseFloat(radius) / 1000
      
      const latDelta = radiusKm / 111
      const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180))
      
      query = query
        .eq('subject_type', 'location')
        .gte('latitude', latNum - latDelta)
        .lte('latitude', latNum + latDelta)
        .gte('longitude', lngNum - lngDelta)
        .lte('longitude', lngNum + lngDelta)
    }

    // 정렬
    switch (sort) {
      case 'rating_desc':
        query = query.order('rating', { ascending: false })
        break
      case 'helpful_desc':
        query = query.order('helpful_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 커서 페이지네이션
    if (cursor) {
      query = query.gt('id', cursor)
    }

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject_type, parking_lot_id, place_id, latitude, longitude, rating, comment } = body

    // 유효성 검사
    if (!subject_type || !['parking_lot', 'place', 'location'].includes(subject_type)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid subject_type' } },
        { status: 400 }
      )
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Rating must be between 1 and 5' } },
        { status: 400 }
      )
    }

    // subject_type에 따른 필수 필드 검증
    if (subject_type === 'parking_lot' && !parking_lot_id) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'parking_lot_id is required' } },
        { status: 400 }
      )
    }
    if (subject_type === 'place' && !place_id) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'place_id is required' } },
        { status: 400 }
      )
    }
    if (subject_type === 'location' && (!latitude || !longitude)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'latitude and longitude are required' } },
        { status: 400 }
      )
    }

    // 리뷰 생성
    const reviewData: any = {
      user_id: user.id,
      subject_type,
      rating,
      comment
    }

    if (subject_type === 'parking_lot') {
      reviewData.parking_lot_id = parking_lot_id
    } else if (subject_type === 'place') {
      reviewData.place_id = place_id
    } else if (subject_type === 'location') {
      reviewData.latitude = latitude
      reviewData.longitude = longitude
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select(`
        *,
        user:profiles(nickname)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}