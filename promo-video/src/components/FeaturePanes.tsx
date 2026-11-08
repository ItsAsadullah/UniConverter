import React from "react";
import { clamp, ez, lerp, MONO_STACK, SANS_STACK, span, typedText } from "./WalkthroughPrimitives";

// ============================================================================
// STEP 1 PANE: বিজয় ⇄ ইউনিকোড কনভার্টার ও অফিস ফাইল (.DOCX/.XLSX/.PPTX) কনভার্টার
// ============================================================================
export const PaneBanglaOffice: React.FC<{ t: number }> = ({ t }) => {
  const isOfficeTab = t >= 10.75;
  const dirClicked = t >= 6.4;

  const sampleUnicode =
    "আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।\nTechHat Studio 2.0 দিয়ে মুহূর্তেই নির্ভুল বাংলা ফন্ট ও ডকুমেন্ট রূপান্তর!";
  const sampleBijoy =
    "Avgvi †mvbvi evsjv, Avwg †Zvgvq fv‡jvevwm|\nTechHat Studio 2.0 w`‡q gyn~‡Z©B wbf©zj evsjv d›U I WKy‡g›U iƒcvšÍi!";

  const typedUni = typedText(sampleUnicode, t, 6.7, 8.35);
  const typedBij = typedText(sampleBijoy, t, 6.75, 8.45);
  const convDone = span(t, 8.4, 8.8);

  const filesDropped = span(t, 12.1, 12.55);
  const officeConverted = span(t, 14.2, 14.85);

  return (
    <div style={{ padding: "24px 30px", fontFamily: SANS_STACK }}>
      {/* Top Mode & Direction Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderRadius: 16,
          backgroundColor: "#f1f5f9",
          border: "1.5px solid #e2e8f0",
          marginBottom: 22,
        }}
      >
        {/* Left: Text vs Office File Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 5,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
          }}
        >
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 9,
              backgroundColor: !isOfficeTab ? "#4f46e5" : "transparent",
              color: !isOfficeTab ? "#ffffff" : "#475569",
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            ⌨️ টেক্সট ও ভয়েস টাইপিং
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 9,
              backgroundColor: isOfficeTab ? "#059669" : "transparent",
              color: isOfficeTab ? "#ffffff" : "#475569",
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            📄 অফিস ফাইল (.DOCX · .XLSX · .PPTX)
          </div>
        </div>

        {/* Center: Conversion Direction Pill */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 5,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            border: "1.5px solid #c7d2fe",
          }}
        >
          <div
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              backgroundColor: dirClicked ? "#10b981" : "#4f46e5",
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            ইউনিকোড → বিজয় (SutonnyMJ)
          </div>
          <div
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              color: "#64748b",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            বিজয় → ইউনিকোড
          </div>
        </div>

        {/* Right: Voice Typing Chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 12,
            backgroundColor: "#fdf4ff",
            border: "1.5px solid #e879f9",
            color: "#a21caf",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              backgroundColor: "#d946ef",
              display: "inline-block",
            }}
          />
          🎤 বাংলা ভয়েস টাইপিং রেডি
        </div>
      </div>

      {!isOfficeTab ? (
        /* SUB-VIEW 1A: INSTANT BIJOY ⇄ UNICODE TEXT CONVERTER */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 24,
          }}
        >
          {/* Unicode Box */}
          <div
            style={{
              height: 440,
              borderRadius: 20,
              backgroundColor: "#ffffff",
              border: "2px solid #818cf8",
              boxShadow: "0 12px 32px rgba(79, 70, 229, 0.08)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 14,
                borderBottom: "1.5px solid #f1f5f9",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
                ইউনিকোড ইনপুট (Unicode Bangla)
              </span>
              <span
                style={{
                  padding: "5px 14px",
                  borderRadius: 8,
                  backgroundColor: "#eef2ff",
                  color: "#4f46e5",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                Kalpurush · অটো ডিটেক্ট
              </span>
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 28,
                lineHeight: 1.55,
                color: "#0f172a",
                fontWeight: 600,
                whiteSpace: "pre-wrap",
              }}
            >
              {typedUni || "এখানে বাংলা ইউনিকোড লিখুন বা পেস্ট করুন…"}
              {t >= 6.6 && t <= 8.5 && Math.floor(t * 4) % 2 === 0 && (
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 30,
                    backgroundColor: "#4f46e5",
                    marginLeft: 4,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#64748b",
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              <span>শব্দ: ১৪ · অক্ষর: ৯৬</span>
              <span style={{ color: "#4f46e5" }}>⚡ রিয়েল-টাইম ইঞ্জিন (0 ms ল্যাগ)</span>
            </div>
          </div>

          {/* Bijoy Output Box */}
          <div
            style={{
              height: 440,
              borderRadius: 20,
              backgroundColor: "#f0fdf4",
              border: "2.5px solid #10b981",
              boxShadow: "0 14px 36px rgba(16, 185, 129, 0.14)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 14,
                borderBottom: "1.5px solid #dcfce7",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 800, color: "#065f46" }}>
                বিজয় আউটপুট (SutonnyMJ ANSI)
              </span>
              <span
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                ✓ ১০০% নির্ভুল যুক্তবর্ণ
              </span>
            </div>

            {/* Rendered in authentic SutonnyMJ + readable preview */}
            <div
              style={{
                flex: 1,
                fontSize: 29,
                lineHeight: 1.55,
                color: "#064e3b",
                fontWeight: 700,
                whiteSpace: "pre-wrap",
              }}
            >
              {typedUni || "বিজয় (SutonnyMJ) আউটপুট এখানে দেখাবে…"}
            </div>

            {/* Raw ANSI Code Strip */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                backgroundColor: "#ffffff",
                border: "1px solid #a7f3d0",
                fontFamily: MONO_STACK,
                fontSize: 15,
                color: "#047857",
                marginBottom: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              ANSI: {typedBij || "Avgvi †mvbvi evsjv..."}
            </div>

            {convDone > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderRadius: 12,
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  fontSize: 19,
                  fontWeight: 800,
                  transform: `scale(${0.94 + 0.06 * ez.back(convDone)})`,
                }}
              >
                <span>✓ ক্লিপবোর্ডে কপি করার জন্য প্রস্তুত</span>
                <span>কপি করুন (Ctrl+C)</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SUB-VIEW 1B: OFFICE FILE CONVERTER (.DOCX, .XLSX, .PPTX, .RTF) */
        <div
          style={{
            borderRadius: 22,
            backgroundColor: "#ffffff",
            border: "2px solid #cbd5e1",
            padding: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
                অফিস ফাইল কনভার্টার — MS Word, Excel, PowerPoint ও RTF
              </div>
              <div style={{ fontSize: 19, color: "#475569", marginTop: 4 }}>
                ফাইলের ভেতরের টেবিল, হেডিং, বোল্ড/ইটালিক, রঙ ও লেআউট ১০০% অক্ষত রেখে বিজয় ⇄ ইউনিকোড রূপান্তর
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["DOCX", "XLSX", "PPTX", "RTF", "TXT"].map((ext) => (
                <span
                  key={ext}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    backgroundColor: "#ecfdf5",
                    border: "1.5px solid #6ee7b7",
                    color: "#047857",
                    fontFamily: MONO_STACK,
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  .{ext}
                </span>
              ))}
            </div>
          </div>

          {/* 3 Dropped Office File Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {[
              {
                name: "মন্ত্রিপরিষদ_প্রতিবেদন_২০২৬.docx",
                type: "MS Word Document · 24 Pages",
                badge: "টেবিল ও স্টাইল অক্ষত",
                col: "#2563eb",
                bg: "#eff6ff",
              },
              {
                name: "বার্ষিক_বাজেট_হিসাব.xlsx",
                type: "MS Excel Spreadsheet · 8 Sheets",
                badge: "ফর্মুলা ও সেল অক্ষত",
                col: "#059669",
                bg: "#ecfdf5",
              },
              {
                name: "প্রজেক্ট_প্রেজেন্টেশন.pptx",
                type: "PowerPoint Deck · 18 Slides",
                badge: "স্লাইড লেআউট অক্ষত",
                col: "#d97706",
                bg: "#fffbeb",
              },
            ].map((f, i) => {
              const cardP = ez.back(span(t, 12.1 + i * 0.16, 12.6 + i * 0.16), 1.8);
              return (
                <div
                  key={i}
                  style={{
                    padding: 22,
                    borderRadius: 18,
                    backgroundColor: f.bg,
                    border: `2px solid ${f.col}44`,
                    opacity: clamp(filesDropped * 1.5),
                    transform: `scale(${0.85 + 0.15 * cardP})`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        backgroundColor: f.col,
                        color: "#ffffff",
                        fontSize: 16,
                        fontWeight: 800,
                      }}
                    >
                      {f.badge}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: officeConverted > 0.2 ? "#059669" : "#64748b",
                      }}
                    >
                      {officeConverted > 0.2 ? "✓ সম্পন্ন (100%)" : "প্রস্তুত"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    {f.name}
                  </div>
                  <div style={{ fontSize: 17, color: "#475569", fontWeight: 600 }}>
                    {f.type}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Convert & Download Action Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 26px",
              borderRadius: 16,
              backgroundColor: officeConverted > 0.1 ? "#ecfdf5" : "#f8fafc",
              border: `2px solid ${officeConverted > 0.1 ? "#10b981" : "#cbd5e1"}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: 21, fontWeight: 800, color: "#065f46" }}>
                  {officeConverted > 0.1
                    ? "৩টি অফিস ফাইল ফরম্যাটিং অক্ষত রেখে সফলভাবে ইউনিকোডে রূপান্তরিত হয়েছে!"
                    : "৩টি অফিস ফাইল নির্বাচিত · ব্রাউজারেই ১০০% অফলাইন রূপান্তর"}
                </div>
                <div style={{ fontSize: 16, color: "#047857", fontWeight: 600 }}>
                  কোনো সার্ভার আপলোড নেই · ফন্ট ও টেবিল স্ট্রাকচার সম্পূর্ণ অক্ষত
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "14px 32px",
                borderRadius: 14,
                backgroundColor: "#059669",
                color: "#ffffff",
                fontSize: 21,
                fontWeight: 800,
                boxShadow: "0 10px 24px rgba(5, 150, 105, 0.28)",
              }}
            >
              ⬇ কনভার্ট ও ডাউনলোড করুন
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STEP 2 PANE: অল-ইন-ওয়ান পিডিএফ স্টুডিও (৮টি প্রো পিডিএফ টুলস)
// ============================================================================
export const PanePdfStudio: React.FC<{ t: number }> = ({ t }) => {
  const isUnlockView = t >= 23.3;
  const compressDone = span(t, 19.2, 19.9);
  const unlockDone = span(t, 25.3, 25.95);

  const subTools = [
    { name: "মার্জ PDF", active: !isUnlockView },
    { name: "স্প্লিট PDF", active: false },
    { name: "কমপ্রেস PDF", active: !isUnlockView },
    { name: "অর্গানাইজ ও রোটেট", active: false },
    { name: "PDF ⇄ Word / JPG", active: isUnlockView },
    { name: "ছবি/অফিস → PDF", active: false },
    { name: "ডিক্রিপ্ট PDF (Unlock)", active: isUnlockView },
    { name: "এনক্রিপ্ট PDF (Lock)", active: false },
  ];

  return (
    <div style={{ padding: "24px 30px", fontFamily: SANS_STACK }}>
      {/* 8 PDF Sub-tool Pills */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 22,
          padding: "12px 16px",
          borderRadius: 16,
          backgroundColor: "#fff1f2",
          border: "1.5px solid #fecdd3",
        }}
      >
        {subTools.map((st, idx) => (
          <div
            key={idx}
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              backgroundColor: st.active ? "#e11d48" : "#ffffff",
              color: st.active ? "#ffffff" : "#334155",
              border: `1.5px solid ${st.active ? "#e11d48" : "#cbd5e1"}`,
              fontSize: 17.5,
              fontWeight: 800,
            }}
          >
            {st.name}
          </div>
        ))}
      </div>

      {!isUnlockView ? (
        /* SUB-VIEW 2A: MULTI-FORMAT MERGE + LIVE COMPRESS PREVIEW */
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 24 }}>
          {/* Left: Merge PDF + Word + Images */}
          <div
            style={{
              borderRadius: 20,
              backgroundColor: "#ffffff",
              border: "2px solid #e2e8f0",
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: 6,
              }}
            >
              মার্জ, স্প্লিট ও পেজ অর্গানাইজার (PDF + DOCX + JPG)
            </div>
            <div style={{ fontSize: 17, color: "#64748b", marginBottom: 18 }}>
              একাধিক PDF, Word, Excel ও ছবি এক ফাইলে যুক্ত করুন অথবা নির্দিষ্ট পেজ রেঞ্জ আলাদা করুন
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 14,
                marginBottom: 18,
              }}
            >
              {[
                { title: "1. Company_Deed.pdf", sub: "৮ পৃষ্ঠা · PDF", tag: "PDF", col: "#e11d48" },
                { title: "2. Financial_Annex.docx", sub: "৫ পৃষ্ঠা · Word", tag: "DOCX", col: "#2563eb" },
                { title: "3. Trade_License_Scan.jpg", sub: "১ পৃষ্ঠা · A4 Fit", tag: "JPG", col: "#059669" },
                { title: "4. Tax_Certificate.pdf", sub: "৪ পৃষ্ঠা · PDF", tag: "PDF", col: "#9333ea" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 18px",
                    borderRadius: 14,
                    backgroundColor: "#f8fafc",
                    border: "1.5px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      padding: "8px 12px",
                      borderRadius: 9,
                      backgroundColor: item.col,
                      color: "#ffffff",
                      fontFamily: MONO_STACK,
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    {item.tag}
                  </span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 15, color: "#64748b", fontWeight: 600 }}>
                      {item.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "14px 20px",
                borderRadius: 14,
                backgroundColor: "#0f172a",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <span>৪টি ফাইল · মোট ১৮ পৃষ্ঠা একত্রিত</span>
              <span style={{ color: "#34d399" }}>✓ পেজ নম্বর ও রোটেশন প্রস্তুত</span>
            </div>
          </div>

          {/* Right: Compress PDF with Live Quality Preview */}
          <div
            style={{
              borderRadius: 20,
              backgroundColor: "#fffbeb",
              border: "2.5px solid #f59e0b",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 800, color: "#78350f" }}>
                  কমপ্রেস PDF (লাইভ প্রিভিউ)
                </span>
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  ৮৭% সাইজ হ্রাস!
                </span>
              </div>

              {/* Before vs After Size Bars */}
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #fde68a",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: 10,
                  }}
                >
                  <span>মূল ফাইল সাইজ (Original):</span>
                  <span style={{ textDecoration: "line-through", color: "#ef4444" }}>
                    14.80 MB
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#059669",
                  }}
                >
                  <span>নতুন সাইজ (Compressed):</span>
                  <span>{compressDone > 0.1 ? "1.92 MB ✓" : "হিসাব হচ্ছে…"}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "16px 22px",
                borderRadius: 14,
                backgroundColor: "#059669",
                color: "#ffffff",
                textAlign: "center",
                fontSize: 21,
                fontWeight: 800,
              }}
            >
              ⬇ মার্জ ও কমপ্রেসড PDF ডাউনলোড করুন
            </div>
          </div>
        </div>
      ) : (
        /* SUB-VIEW 2B: DECRYPT PDF (UNLOCK WITHOUT PASSWORD) & PDF ⇄ WORD/JPG */
        <div
          style={{
            borderRadius: 22,
            backgroundColor: "#ffffff",
            border: "2px solid #cbd5e1",
            padding: 28,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 26,
          }}
        >
          {/* Left: Decrypt / Encrypt Security Studio */}
          <div
            style={{
              padding: 24,
              borderRadius: 18,
              backgroundColor: unlockDone > 0.1 ? "#ecfdf5" : "#fef2f2",
              border: `2.5px solid ${unlockDone > 0.1 ? "#10b981" : "#f43f5e"}`,
            }}
          >
            <div style={{ fontSize: 25, fontWeight: 800, color: "#0f172a" }}>
              🔓 ডিক্রিপ্ট ও এনক্রিপ্ট PDF (PDF Security)
            </div>
            <div style={{ fontSize: 18, color: "#475569", marginTop: 6, marginBottom: 20 }}>
              পাসওয়ার্ড বা প্রিন্ট/কপি লক দেওয়া PDF ফাইল এক ক্লিকে আনলক করুন অথবা নতুন ১২৮-বিট পাসওয়ার্ড সেট করুন
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 14,
                backgroundColor: "#ffffff",
                border: "1.5px solid #cbd5e1",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 21, fontWeight: 800, color: "#0f172a" }}>
                📄 Bank_Statement_Protected.pdf
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: unlockDone > 0.1 ? "#059669" : "#e11d48",
                  marginTop: 8,
                }}
              >
                {unlockDone > 0.1
                  ? "✓ আনলক সম্পন্ন! প্রিন্ট, কপি ও এডিট রেস্ট্রিকশন সরানো হয়েছে"
                  : "🔒 স্ট্যাটাস: প্রিন্ট ও কপি পারমিশন লকড"}
              </div>
            </div>

            <div
              style={{
                padding: "15px 24px",
                borderRadius: 14,
                backgroundColor: unlockDone > 0.1 ? "#059669" : "#e11d48",
                color: "#ffffff",
                fontSize: 21,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {unlockDone > 0.1
                ? "✓ আনলকড PDF ডাউনলোড প্রস্তুত"
                : "🔓 পাসওয়ার্ড ছাড়াই আনলক করুন"}
            </div>
          </div>

          {/* Right: PDF ⇄ Editable Word (.doc/.docx), High-Res JPG/PNG & Text */}
          <div
            style={{
              padding: 24,
              borderRadius: 18,
              backgroundColor: "#eff6ff",
              border: "2px solid #60a5fa",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 25, fontWeight: 800, color: "#1e3a8a" }}>
                🔄 PDF ⇄ Word, JPG, PNG ও Text কনভার্টার
              </div>
              <div style={{ fontSize: 18, color: "#334155", marginTop: 6, marginBottom: 18 }}>
                যেকোনো PDF ফাইলকে এডিটেবল MS Word ডকুমেন্ট কিংবা হাই-রেজোলিউশন ছবিতে রূপান্তর করুন
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { title: "PDF → MS Word (.doc)", desc: "সরাসরি এডিটেবল ডকুমেন্ট" },
                  { title: "PDF → 300 DPI JPG/PNG", desc: "প্রতিটি পৃষ্ঠা আলাদা ছবি" },
                  { title: "Word / Excel → PDF", desc: "অফিস ফাইল থেকে A4 PDF" },
                  { title: "PDF → Plain Text (.txt)", desc: "তাৎক্ষণিক টেক্সট এক্সট্র্যাক্ট" },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: "#ffffff",
                      border: "1.5px solid #bfdbfe",
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af" }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 15, color: "#64748b", marginTop: 2 }}>
                      {c.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: "13px 20px",
                borderRadius: 12,
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                fontSize: 19,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              ✓ সব রূপান্তর ১০০% অফলাইনে আপনার ব্রাউজারেই সম্পন্ন হয়
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STEP 3 PANE: ইমেজ ও স্ক্যানার স্টুডিও (NID, Passport, Doc Scanner, Converter & Raster to Vector)
// ============================================================================
export const PaneImageScannerVector: React.FC<{ t: number }> = ({ t }) => {
  const mode: "scanners" | "converter" | "vector" =
    t < 37.2 ? "scanners" : t < 39.7 ? "converter" : "vector";

  const splitPct = 30 + 48 * ez.inout3(span(t, 40.6, 41.9));

  return (
    <div style={{ padding: "24px 30px", fontFamily: SANS_STACK }}>
      {/* Sub-navigation bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 22,
          padding: "10px 16px",
          borderRadius: 16,
          backgroundColor: "#f0f9ff",
          border: "1.5px solid #bae6fd",
        }}
      >
        {[
          {
            id: "scanners",
            label: "✦ NID · পাসপোর্ট (৬-পয়েন্ট) · প্রো ডকুমেন্ট স্ক্যানার",
          },
          {
            id: "converter",
            label: "🖼️ ইমেজ কনভার্টার ও সরকারি চাকরির ছবি (300×300)",
          },
          {
            id: "vector",
            label: "✒️ রাস্টার ইমেজ টু ভেক্টর (SVG · EPS · Adobe AI)",
          },
        ].map((tab) => {
          const active = mode === tab.id;
          return (
            <div
              key={tab.id}
              style={{
                padding: "10px 22px",
                borderRadius: 12,
                backgroundColor: active ? "#0284c7" : "#ffffff",
                color: active ? "#ffffff" : "#334155",
                border: `1.5px solid ${active ? "#0284c7" : "#cbd5e1"}`,
                fontSize: 18.5,
                fontWeight: 800,
              }}
            >
              {tab.label}
            </div>
          );
        })}
      </div>

      {mode === "scanners" && (
        /* 3-CARD SMART SCANNER WORKBENCH */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
          {/* 1. NID Card Scanner */}
          <div
            style={{
              borderRadius: 20,
              backgroundColor: "#ffffff",
              border: `2.5px solid ${t >= 31.1 ? "#0d9488" : "#cbd5e1"}`,
              padding: 22,
              boxShadow: "0 12px 30px rgba(13, 148, 136, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "#ccfbf1",
                  color: "#0f766e",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                NID কার্ড স্ক্যানার
              </span>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#059669" }}>
                ✓ A4 Print Ready
              </span>
            </div>
            <div style={{ fontSize: 23, fontWeight: 800, color: "#0f172a" }}>
              সামনের ও পেছনের অংশ এক A4 পাতায়
            </div>
            {/* Visual A4 Dual Card Mock */}
            <div
              style={{
                height: 220,
                marginTop: 14,
                marginBottom: 14,
                borderRadius: 14,
                backgroundColor: "#f8fafc",
                border: "1.5px dashed #14b8a6",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  height: 76,
                  borderRadius: 10,
                  backgroundColor: "#ecfdf5",
                  border: "2px solid #10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#065f46",
                }}
              >
                <span>▣ NID Front Side (Auto Perspective Crop)</span>
                <span>✓ 300 DPI</span>
              </div>
              <div
                style={{
                  height: 76,
                  borderRadius: 10,
                  backgroundColor: "#eff6ff",
                  border: "2px solid #3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#1e40af",
                }}
              >
                <span>▣ NID Back Side + Barcode Sharp</span>
                <span>✓ Aligned</span>
              </div>
            </div>
            <div style={{ fontSize: 17, color: "#475569", fontWeight: 600 }}>
              অটো পার্সপেক্টিভ ক্রপ ও সরাসরি প্রিন্ট রেডি A4 PDF
            </div>
          </div>

          {/* 2. Passport 6-Point Scanner */}
          <div
            style={{
              borderRadius: 20,
              backgroundColor: "#ffffff",
              border: `2.5px solid ${t >= 32.9 ? "#059669" : "#cbd5e1"}`,
              padding: 22,
              boxShadow: "0 12px 30px rgba(5, 150, 105, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "#d1fae5",
                  color: "#065f46",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                পাসপোর্ট মেকার ও স্ক্যানার
              </span>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#059669" }}>
                ✓ 6-Point De-Warp
              </span>
            </div>
            <div style={{ fontSize: 23, fontWeight: 800, color: "#0f172a" }}>
              ৬-পয়েন্ট ভাঁজ সংশোধন ও অটো ডি-ওয়ার্প
            </div>
            {/* Visual 6-Point Mesh Mock */}
            <div
              style={{
                height: 220,
                marginTop: 14,
                marginBottom: 14,
                borderRadius: 14,
                backgroundColor: "#0f172a",
                padding: 18,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "2px solid #10b981",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#34d399",
                  fontFamily: MONO_STACK,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                <span>● P1 (Top-L)</span>
                <span>● P2 (Fold-Top)</span>
                <span>● P3 (Top-R)</span>
              </div>
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.95)",
                  color: "#0f172a",
                  fontSize: 17,
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                🛂 PASSPORT BIO PAGE + MRZ STRIP FLAT ✓
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#fbbf24",
                  fontFamily: MONO_STACK,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                <span>● P4 (Bot-L)</span>
                <span>● P5 (Fold-Bot)</span>
                <span>● P6 (Bot-R)</span>
              </div>
            </div>
            <div style={{ fontSize: 17, color: "#475569", fontWeight: 600 }}>
              পাসপোর্টের মাঝের বাঁকা ভাঁজ সোজা করে ফ্ল্যাট স্ক্যান আউটপুট
            </div>
          </div>

          {/* 3. Pro Document Scanner with Photoshop Toolbar */}
          <div
            style={{
              borderRadius: 20,
              backgroundColor: "#ffffff",
              border: `2.5px solid ${t >= 34.9 ? "#4f46e5" : "#cbd5e1"}`,
              padding: 22,
              boxShadow: "0 12px 30px rgba(79, 70, 229, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "#e0e7ff",
                  color: "#3730a3",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                প্রো ডকুমেন্ট স্ক্যানার
              </span>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#4f46e5" }}>
                ✓ Magic+ & Retouch
              </span>
            </div>
            <div style={{ fontSize: 23, fontWeight: 800, color: "#0f172a" }}>
              শ্যাডো ফিক্স ও ফটোশপ রিটাচ টুলবার
            </div>
            <div
              style={{
                height: 220,
                marginTop: 14,
                marginBottom: 14,
                borderRadius: 14,
                backgroundColor: "#f8fafc",
                border: "1.5px solid #c7d2fe",
                padding: 14,
                display: "flex",
                gap: 12,
              }}
            >
              {/* Mini Photoshop Tool Dock */}
              <div
                style={{
                  width: 48,
                  borderRadius: 10,
                  backgroundColor: "#1e293b",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-around",
                  padding: "8px 0",
                  color: "#e2e8f0",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <span>✥</span>
                <span>🩹</span>
                <span>🖌️</span>
                <span>◎</span>
                <span>T</span>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 9,
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #818cf8",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  ✨ Magic+ ছায়া ও দাগ রিমুভাল
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 9,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    fontSize: 15.5,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  🩹 Spot Heal · Clone Stamp · Layers
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 9,
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #6ee7b7",
                    fontSize: 15.5,
                    fontWeight: 800,
                    color: "#065f46",
                  }}
                >
                  ✓ মাল্টি-পেজ A4 PDF এক্সপোর্ট
                </div>
              </div>
            </div>
            <div style={{ fontSize: 17, color: "#475569", fontWeight: 600 }}>
              অটো ক্রপ, শ্যাডো রিমুভ ও ২৫+ বাংলা ফন্ট লেয়ার এডিটর
            </div>
          </div>
        </div>
      )}

      {mode === "converter" && (
        /* IMAGE CONVERTER, RESIZER (300x300 GOVT JOB), COMPRESS & WATERMARK */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            borderRadius: 20,
            backgroundColor: "#ffffff",
            border: "2px solid #cbd5e1",
            padding: 26,
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 18,
              backgroundColor: "#f5f3ff",
              border: "2px solid #8b5cf6",
            }}
          >
            <div style={{ fontSize: 25, fontWeight: 800, color: "#4c1d95" }}>
              👔 সরকারি চাকরির ছবি (300×300) ও স্বাক্ষর (300×80)
            </div>
            <div style={{ fontSize: 18, color: "#475569", marginTop: 6, marginBottom: 18 }}>
              টেলিটক, বিসিএস ও সরকারি চাকরির আবেদনের নির্ধারিত পিক্সেল ও KB সীমার মধ্যে ১-ক্লিক রিসাইজ
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div
                style={{
                  padding: 18,
                  borderRadius: 14,
                  backgroundColor: "#ffffff",
                  border: "2px solid #10b981",
                }}
              >
                <div style={{ fontSize: 21, fontWeight: 800, color: "#0f172a" }}>
                  👤 রঙিন ছবি: 300 × 300 px
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#059669", marginTop: 6 }}>
                  ✓ সাইজ: 42 KB (সীমা: &lt; 100 KB)
                </div>
              </div>
              <div
                style={{
                  padding: 18,
                  borderRadius: 14,
                  backgroundColor: "#ffffff",
                  border: "2px solid #10b981",
                }}
              >
                <div style={{ fontSize: 21, fontWeight: 800, color: "#0f172a" }}>
                  ✍️ স্বাক্ষর: 300 × 80 px
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#059669", marginTop: 6 }}>
                  ✓ সাইজ: 18 KB (সীমা: &lt; 60 KB)
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 18,
              backgroundColor: "#fffbeb",
              border: "2px solid #f59e0b",
            }}
          >
            <div style={{ fontSize: 25, fontWeight: 800, color: "#78350f" }}>
              🔄 ইমেজ ফরম্যাট কনভার্টার, কমপ্রেসর ও ক্রপ
            </div>
            <div style={{ fontSize: 18, color: "#475569", marginTop: 6, marginBottom: 18 }}>
              JPG ⇄ PNG ⇄ WebP রূপান্তর, ছবির KB কমানো, গোল প্রোফাইল ছবি ও বাংলা ওয়াটারমার্ক
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                "JPG ⇄ PNG ⇄ WebP",
                "ইমেজ KB কমপ্রেসর (50 KB টার্গেট)",
                "রাউন্ড প্রোফাইল ফটো মেকার",
                "বাংলা টেক্সট ওয়াটারমার্ক",
              ].map((tag, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #fcd34d",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#92400e",
                  }}
                >
                  ✓ {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "vector" && (
        /* RASTER IMAGE TO VECTOR (SVG, EPS, ADOBE AI) */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 24,
            borderRadius: 22,
            backgroundColor: "#ffffff",
            border: "2.5px solid #8b5cf6",
            padding: 24,
          }}
        >
          {/* Left: Split Before/After Vector Viewport */}
          <div
            style={{
              height: 390,
              borderRadius: 18,
              backgroundColor: "#0f172a",
              position: "relative",
              overflow: "hidden",
              border: "2px solid #6366f1",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 18,
                top: 16,
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(0,0,0,0.65)",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 800,
                zIndex: 5,
              }}
            >
              মূল ছবি (Raster PNG/JPG)
            </div>
            <div
              style={{
                position: "absolute",
                right: 18,
                top: 16,
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: "#7c3aed",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 800,
                zIndex: 5,
              }}
            >
              ভেক্টর পাথ ও নোড (Editable Vector)
            </div>

            {/* Center Vectorized Emblem Graphic with Bézier Nodes */}
            <svg width="100%" height="100%" viewBox="0 0 700 390">
              <circle
                cx={350}
                cy={195}
                r={115}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={5}
              />
              <polygon
                points="350,95 440,255 260,255"
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#34d399"
                strokeWidth={4}
              />
              {/* Anchor points */}
              {[
                [350, 80],
                [465, 195],
                [350, 310],
                [235, 195],
                [350, 95],
                [440, 255],
                [260, 255],
              ].map(([px, py], idx) => (
                <rect
                  key={idx}
                  x={px - 6}
                  y={py - 6}
                  width={12}
                  height={12}
                  fill="#ffffff"
                  stroke="#f43f5e"
                  strokeWidth={3}
                />
              ))}
            </svg>

            {/* Split Divider Line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${splitPct}%`,
                width: 4,
                backgroundColor: "#ffffff",
                boxShadow: "0 0 16px rgba(255,255,255,0.9)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#7c3aed",
                  border: "3px solid #ffffff",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                ↔
              </div>
            </div>
          </div>

          {/* Right: Vector Stats & Export Formats (SVG, EPS, AI) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 25, fontWeight: 800, color: "#0f172a" }}>
                রাস্টার টু ভেক্টর কনভার্টার
              </div>
              <div style={{ fontSize: 17.5, color: "#475569", marginTop: 6, marginBottom: 18 }}>
                যেকোনো PNG, JPG বা লোগো ছবিকে সম্পূর্ণ অফলাইনে সম্পাদনাযোগ্য ভেক্টর ফাইলে ট্রেস করুন
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {[
                  { k: "পাথ (Paths)", v: "42" },
                  { k: "নোড (Nodes)", v: "318" },
                  { k: "রং (Colors)", v: "Full Color" },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: "#f5f3ff",
                      border: "1.5px solid #ddd6fe",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 15, color: "#6d28d9", fontWeight: 700 }}>
                      {s.k}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4c1d95" }}>
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div
              style={{
                padding: 18,
                borderRadius: 16,
                backgroundColor: "#ede9fe",
                border: "2px solid #8b5cf6",
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#4c1d95",
                  marginBottom: 10,
                }}
              >
                সরাসরি ভেক্টর ফাইল ডাউনলোড করুন:
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {["⬇ SVG ভেক্টর", "⬇ EPS প্রিন্ট", "⬇ Adobe AI"].map((btn, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: "12px 10px",
                      borderRadius: 10,
                      backgroundColor: i === 0 ? "#6d28d9" : "#ffffff",
                      color: i === 0 ? "#ffffff" : "#4c1d95",
                      border: "1.5px solid #6d28d9",
                      textAlign: "center",
                      fontSize: 17,
                      fontWeight: 800,
                    }}
                  >
                    {btn}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STEP 4 PANE: তারিখ কনভার্টার, বয়স ক্যালকুলেটর, ইনভয়েস মেকার ও অন্যান্য ইউটিলিটিস
// ============================================================================
export const PaneDatesInvoiceUtilities: React.FC<{ t: number }> = ({ t }) => {
  const ageDone = span(t, 48.0, 48.5);
  const invTyped = typedText("রহমান ট্রেডার্স অ্যান্ড কোং", t, 50.1, 51.2);
  const invReady = span(t, 52.3, 52.8);

  return (
    <div
      style={{
        padding: "24px 30px",
        fontFamily: SANS_STACK,
        display: "grid",
        gridTemplateColumns: "0.95fr 1.05fr",
        gap: 24,
      }}
    >
      {/* LEFT COLUMN: DATE CONVERTER + AGE CALCULATOR + EXTRA UTILITIES */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Card 1: Bangla, English & Hijri Date Converter */}
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            backgroundColor: "#eff6ff",
            border: "2px solid #3b82f6",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color: "#1e3a8a" }}>
              📅 বাংলা · ইংরেজি · হিজরি তারিখ কনভার্টার ও দিন গণনা
            </span>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              ৩-ক্যালেন্ডার সিঙ্ক
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "বাংলা বঙ্গাব্দ", val: "২৩ কার্তিক ১৪৩৩", sub: "হেমন্তকাল" },
              { label: "ইংরেজি (Gregorian)", val: "8 November 2026", sub: "রবিবার" },
              { label: "আরবি হিজরি সন", val: "২৭ জমাদিউল আউয়াল", sub: "১৪৪৮ হিজরি" },
            ].map((d, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #bfdbfe",
                }}
              >
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 3 }}>
                  {d.val}
                </div>
                <div style={{ fontSize: 14, color: "#2563eb", fontWeight: 700 }}>
                  {d.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Exact Age Calculator */}
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            backgroundColor: "#faf5ff",
            border: "2px solid #a855f7",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color: "#581c87" }}>
              🎂 নিখুঁত বয়স ক্যালকুলেটর (চাকরির আবেদন প্রিসেট)
            </span>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                backgroundColor: "#9333ea",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              {ageDone > 0.1 ? "✓ বয়স যাচাইকৃত" : "জন্মতারিখ হিসাব"}
            </span>
          </div>
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              backgroundColor: "#ffffff",
              border: "1.5px solid #e9d5ff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 15, color: "#64748b", fontWeight: 700 }}>
                বর্তমান নিখুঁত বয়স:
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#6b21a8" }}>
                ২৪ বছর · ৭ মাস · ১২ দিন
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 16, fontWeight: 700, color: "#059669" }}>
              ✓ মোট ৮,৯৯১ দিন
              <br />
              সরকারি চাকরির সীমা OK
            </div>
          </div>
        </div>

        {/* Card 3: Other Utilities Strip */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 16,
            backgroundColor: "#f8fafc",
            border: "1.5px solid #cbd5e1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 17.5, fontWeight: 800, color: "#334155" }}>
            🛠️ আরও ইউটিলিটি টুলস:
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            {["🎨 কালার প্যালেট (HEX/RGB)", "🧬 ইমেজ টু Base64", "⏱️ তারিখের ব্যবধান"].map(
              (u, i) => (
                <span
                  key={i}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    backgroundColor: "#ffffff",
                    border: "1px solid #94a3b8",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {u}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: A4 INVOICE & CASH MEMO MAKER */}
      <div
        style={{
          borderRadius: 20,
          backgroundColor: "#ffffff",
          border: "2.5px solid #10b981",
          padding: 24,
          boxShadow: "0 14px 36px rgba(16, 185, 129, 0.12)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 14,
              borderBottom: "2px solid #0f172a",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                🧾 ইনভয়েস ও ক্যাশ মেমো মেকার (A4 Print)
              </div>
              <div style={{ fontSize: 15.5, color: "#64748b", fontWeight: 600 }}>
                ইনভয়েস নং: #INV-2026 · মুদ্রা: ৳ BDT · পেমেন্ট: বিকাশ / নগদ
              </div>
            </div>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "#d1fae5",
                color: "#065f46",
                fontSize: 16,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              পরিশোধিত (PAID ✓)
            </span>
          </div>

          {/* Customer Row */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              backgroundColor: "#f8fafc",
              border: "1.5px solid #cbd5e1",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#475569" }}>গ্রাহকের নাম:</span>
            <span style={{ color: "#0f172a", fontWeight: 800 }}>
              {invTyped || "রহমান ট্রেডার্স…"}
            </span>
          </div>

          {/* Invoice Line Items */}
          <div
            style={{
              borderRadius: 12,
              border: "1.5px solid #e2e8f0",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            {[
              { item: "১. ওয়েব অ্যাপ্লিকেশন ও ব্র্যান্ডিং ডিজাইন", qty: "১", total: "৳ ১০,০০০" },
              { item: "২. অফিস ডকুমেন্ট অটোমেশন সেটআপ", qty: "১", total: "৳ ২,৫০০" },
            ].map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "11px 16px",
                  borderBottom: idx === 0 ? "1px solid #e2e8f0" : "none",
                  fontSize: 17.5,
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                <span>{row.item}</span>
                <span>{row.total}</span>
              </div>
            ))}
          </div>

          {/* Total & Bangla Taka in Words */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              backgroundColor: "#ecfdf5",
              border: "1.5px solid #6ee7b7",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 16.5, fontWeight: 700, color: "#065f46" }}>
              কথায়: <strong>বারো হাজার পাঁচশত টাকা মাত্র</strong>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#047857" }}>
              মোট: ৳ ১২,৫০০/-
            </div>
          </div>
        </div>

        {/* Bottom Print / Save PDF Bar */}
        <div
          style={{
            marginTop: 14,
            padding: "14px 22px",
            borderRadius: 14,
            backgroundColor: invReady > 0.1 ? "#047857" : "#059669",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          <span>🖨️ প্রিন্ট / সেভ A4 PDF ইনভয়েস</span>
          <span>{invReady > 0.1 ? "✓ PDF ডাউনলোড সম্পন্ন!" : "১ ক্লিকে প্রিন্ট"}</span>
        </div>
      </div>
    </div>
  );
};
