import { SignJWT, jwtVerify } from "jose";
import { authSecret } from "./constants";

export type SessionToken = {
  sub: string;
  role: string;
  departmentId: string | null;
};

export async function signSession(payload: SessionToken) {
  return new SignJWT({ role: payload.role, departmentId: payload.departmentId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(authSecret());
}

export async function verifySession(token: string): Promise<SessionToken> {
  const { payload } = await jwtVerify(token, authSecret());
  return {
    sub: String(payload.sub),
    role: String(payload.role ?? ""),
    departmentId: payload.departmentId ? String(payload.departmentId) : null,
  };
}
