import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { placeIngestSchema, validateRequest, formatZodError } from '@/lib/validation'

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
    
    // 관리자 권한 확인 (profiles 테이블에 is_admin 필드가 있다고 가정)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // 입력 검증
    const validation = validateRequest(placeIngestSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: formatZodError(validation.error) } },
        { status: 400 }
      )
    }
    
    const { provider, external_place_id, name, address, latitude, longitude } = validation.data

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