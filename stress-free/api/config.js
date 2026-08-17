// Vercel Serverless Function.
// Vercel 프로젝트 Settings > Environment Variables에 SUPABASE_URL / SUPABASE_ANON_KEY를
// 등록해두면, 빌드 없이도 이 엔드포인트를 통해 프론트엔드로 값을 넘겨준다.
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
};
