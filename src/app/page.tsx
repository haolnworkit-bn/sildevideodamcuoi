import Gallery from "@/components/Gallery";
import { FEATURES, formatVnd } from "@/config/features";

export default function Home() {
  return (
    <div className="home">
      <header className="topbar">
        <span className="brand">{FEATURES.brandName}</span>
      </header>
      <section className="hero">
        <h1>Video nền cho lễ dạm ngõ, ăn hỏi</h1>
        <p>
          Nhập tên hai bạn, ngày lễ và lời cảm ơn, rồi xuất video MP4 Full HD lặp liền mạch để chiếu lên TV hoặc máy
          chiếu. Không cần cài phần mềm.
        </p>
        <ul className="hero-points">
          <li>Tự đổi ngày âm lịch</li>
          <li>1920×1080 · 20 giây</li>
          <li>{FEATURES.monetization ? `Từ ${formatVnd(FEATURES.pricePerVideo)} / video` : "Miễn phí"}</li>
        </ul>
      </section>
      <Gallery />
    </div>
  );
}
