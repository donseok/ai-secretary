/**
 * Google Calendar OAuth2 토큰 발급 스크립트
 *
 * 사용법:
 * 1. Google Cloud Console (https://console.cloud.google.com) 에서:
 *    - 프로젝트 생성 또는 선택
 *    - Google Calendar API 활성화
 *    - OAuth 2.0 클라이언트 ID 생성 (유형: 데스크톱 앱)
 *    - 클라이언트 ID와 시크릿 복사
 *
 * 2. 아래 값을 입력하고 실행:
 *    GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-token.mjs
 *
 * 3. 브라우저에서 로그인 후 리디렉트된 URL의 code 파라미터를 복사해서 입력
 * 4. 출력된 refresh_token을 .env.local에 저장
 */

import { google } from "googleapis";
import { createInterface } from "readline";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("환경변수를 설정하세요:");
  console.error("GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-token.mjs");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "urn:ietf:wg:oauth:2.0:oob");

const url = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/calendar.readonly"],
  prompt: "consent",
});

console.log("\n아래 URL을 브라우저에서 열어 로그인하세요:\n");
console.log(url);
console.log("\n로그인 후 표시되는 인증 코드를 아래에 붙여넣으세요:\n");

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question("인증 코드: ", async (code) => {
  try {
    const { tokens } = await oauth2.getToken(code.trim());
    console.log("\n=== .env.local에 아래 내용을 추가하세요 ===\n");
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\n==========================================\n");
  } catch (err) {
    console.error("토큰 발급 실패:", err.message);
  }
  rl.close();
});
