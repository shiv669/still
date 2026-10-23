import { NextResponse } from "next/server"

export default function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth).*)",
  ],
}
