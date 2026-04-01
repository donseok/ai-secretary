const WEATHER_DESCRIPTIONS: Record<number, { desc: string; icon: string }> = {
  0: { desc: "맑음", icon: "☀️" },
  1: { desc: "대체로 맑음", icon: "🌤️" },
  2: { desc: "구름 조금", icon: "⛅" },
  3: { desc: "흐림", icon: "☁️" },
  45: { desc: "안개", icon: "🌫️" },
  48: { desc: "안개", icon: "🌫️" },
  51: { desc: "이슬비", icon: "🌦️" },
  53: { desc: "이슬비", icon: "🌦️" },
  55: { desc: "이슬비", icon: "🌦️" },
  61: { desc: "비", icon: "🌧️" },
  63: { desc: "비", icon: "🌧️" },
  65: { desc: "폭우", icon: "🌧️" },
  71: { desc: "눈", icon: "🌨️" },
  73: { desc: "눈", icon: "🌨️" },
  75: { desc: "폭설", icon: "🌨️" },
  80: { desc: "소나기", icon: "🌦️" },
  81: { desc: "소나기", icon: "🌦️" },
  82: { desc: "강한 소나기", icon: "⛈️" },
  95: { desc: "뇌우", icon: "⛈️" },
  96: { desc: "우박 뇌우", icon: "⛈️" },
  99: { desc: "우박 뇌우", icon: "⛈️" },
};

export async function GET() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=35.1796&longitude=129.0756&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=1",
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();

    const code = data.current.weather_code;
    const weather = WEATHER_DESCRIPTIONS[code] || { desc: "알 수 없음", icon: "🌡️" };

    return Response.json({
      temp: Math.round(data.current.temperature_2m),
      tempMax: Math.round(data.daily.temperature_2m_max[0]),
      tempMin: Math.round(data.daily.temperature_2m_min[0]),
      humidity: data.current.relative_humidity_2m,
      wind: Math.round(data.current.wind_speed_10m),
      description: weather.desc,
      icon: weather.icon,
      city: "부산",
    });
  } catch {
    return Response.json({
      temp: null,
      description: "날씨 정보를 불러올 수 없습니다",
      icon: "🌡️",
      city: "부산",
    });
  }
}
