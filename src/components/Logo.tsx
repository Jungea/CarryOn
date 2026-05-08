interface LogoProps {
  size?: number   // 높이 기준 px
  white?: boolean // 흰색 테마 (어두운 배경용)
}

export default function Logo({ size = 28, white = false }: LogoProps) {
  const text = white ? '#F8FAFC' : '#1E293B'
  const sub = white ? '#94A3B8' : '#64748B'
  const boxStroke = white ? '#F8FAFC' : '#1E293B'
  const checkStroke = white ? '#94A3B8' : '#64748B'

  // 폰트 크기 기준으로 체크박스 크기 계산
  const fs = size * 0.85
  const box = fs * 0.78
  const r = box * 0.22

  return (
    <svg
      height={size}
      viewBox={`0 0 ${fs * 4.6} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Carry */}
      <text
        y={size * 0.78}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize={fs}
        fontWeight="700"
        fill={text}
        letterSpacing="-0.5"
      >Carry</text>

      {/* O → 체크박스 */}
      <rect
        x={fs * 2.78}
        y={(size - box) / 2}
        width={box}
        height={box}
        rx={r}
        fill="none"
        stroke={boxStroke}
        strokeWidth={box * 0.12}
      />
      <path
        d={`M${fs * 2.78 + box * 0.22} ${size / 2} L${fs * 2.78 + box * 0.45} ${(size - box) / 2 + box * 0.72} L${fs * 2.78 + box * 0.78} ${(size - box) / 2 + box * 0.28}`}
        fill="none"
        stroke={checkStroke}
        strokeWidth={box * 0.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* n */}
      <text
        x={fs * 3.63}
        y={size * 0.78}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize={fs}
        fontWeight="700"
        fill={text}
        letterSpacing="-0.5"
      >n</text>
    </svg>
  )
}
