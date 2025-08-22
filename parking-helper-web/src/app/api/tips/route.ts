import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
    const { parking_lot_id, content, discount_info } = body

    // 유효성 검사
    if (!parking_lot_id || !content) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'parking_lot_id and content are required' } },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Content is too long (max 500 characters)' } },
        { status: 400 }
      )
    }

    // 주차장 존재 확인
    const { data: parkingLot, error: parkingError } = await supabase
      .from('parking_lots')
      .select('id')
      .eq('id', parking_lot_id)
      .single()

    if (parkingError || !parkingLot) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Parking lot not found' } },
        { status: 404 }
      )
    }

    // 팁 생성
    const { data, error } = await supabase
      .from('tips')
      .insert([{
        user_id: user.id,
        parking_lot_id,
        content,
        discount_info
      }])
      .select(`
        *,
        user:profiles(nickname),
        parking_lot:parking_lots(name)
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