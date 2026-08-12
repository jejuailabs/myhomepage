import { redirect } from 'next/navigation';

/** 제작 플로우는 편집 화면(/me)과 동일하다. */
export default function CreatePage() {
  redirect('/me');
}
