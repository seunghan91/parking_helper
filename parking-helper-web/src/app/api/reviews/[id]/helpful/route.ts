import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

    // 리뷰 존재 확인
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Review not found' } },
        { status: 404 }
      )
    }

    // 이미 도움돼요를 눌렀는지 확인
    const { data: existing } = await supabase
      .from('review_helpfuls')
      .select('id')
      .eq('review_id', id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { data: { message: 'Already marked as helpful' } },
        { status: 200 }
      )
    }

    // 도움돼요 추가
    const { error: insertError } = await supabase
      .from('review_helpfuls')
      .insert([{
        review_id: id,
        user_id: user.id
      }])

    if (insertError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: insertError.message } },
        { status: 500 }
      )
    }

    // helpful_count 증가
    const { error: updateError } = await supabase.rpc('increment_helpful_count', {
      review_id: id
    })

    if (updateError) {
      // RPC 함수가 없는 경우 직접 업데이트
      await supabase
        .from('reviews')
        .update({ helpful_count: supabase.raw('helpful_count + 1') })
        .eq('id', id)
    }

    return NextResponse.json(
      { data: { message: 'Marked as helpful' } },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

    // 도움돼요 삭제
    const { error: deleteError } = await supabase
      .from('review_helpfuls')
      .delete()
      .eq('review_id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: deleteError.message } },
        { status: 500 }
      )
    }

    // helpful_count 감소
    const { error: updateError } = await supabase.rpc('decrement_helpful_count', {
      review_id: id
    })

    if (updateError) {
      // RPC 함수가 없는 경우 직접 업데이트
      await supabase
        .from('reviews')
        .update({ helpful_count: supabase.raw('GREATEST(helpful_count - 1, 0)') })
        .eq('id', id)
    }

    return NextResponse.json(
      { data: { message: 'Unmarked as helpful' } },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}