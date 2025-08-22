import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const { 
      provider, 
      external_place_id, 
      name, 
      address, 
      latitude, 
      longitude 
    } = body

    // 유효성 검사
    if (!provider || !external_place_id || !name) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'provider, external_place_id, and name are required' } },
        { status: 400 }
      )
    }

    if (!['naver', 'kakao', 'google'].includes(provider)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid provider' } },
        { status: 400 }
      )
    }

    // 이미 존재하는 place_link 확인
    const { data: existingLink } = await supabase
      .from('place_links')
      .select('place_id')
      .eq('provider', provider)
      .eq('external_place_id', external_place_id)
      .single()

    if (existingLink) {
      // 이미 존재하는 장소 반환
      const { data: place } = await supabase
        .from('places')
        .select('*')
        .eq('id', existingLink.place_id)
        .single()

      return NextResponse.json({ 
        data: { 
          place,
          existing: true 
        } 
      })
    }

    // 새로운 장소 생성
    const { data: newPlace, error: placeError } = await supabase
      .from('places')
      .insert([{
        name,
        address,
        latitude,
        longitude
      }])
      .select()
      .single()

    if (placeError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: placeError.message } },
        { status: 500 }
      )
    }

    // place_link 생성
    const { error: linkError } = await supabase
      .from('place_links')
      .insert([{
        place_id: newPlace.id,
        provider,
        external_place_id
      }])

    if (linkError) {
      // 링크 생성 실패 시 장소도 삭제 (트랜잭션이 없으므로)
      await supabase
        .from('places')
        .delete()
        .eq('id', newPlace.id)

      return NextResponse.json(
        { error: { code: 'INTERNAL', message: linkError.message } },
        { status: 500 }
      )
    }

    // 별칭 추가 (선택사항)
    if (name !== newPlace.name) {
      await supabase
        .from('place_aliases')
        .insert([{
          place_id: newPlace.id,
          alias: name,
          provider
        }])
    }

    return NextResponse.json({ 
      data: { 
        place: newPlace,
        existing: false 
      } 
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}