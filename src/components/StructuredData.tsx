import type { StructuredDataBlock } from "@/lib/seo-shared";

/** يعقّم `</script>` داخل الـ JSON عشان محتوى محفوظ من الأدمن ميقدرش يكسر الصفحة. */
function safeJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function StructuredData({ blocks }: { blocks: StructuredDataBlock[] }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <>
      {blocks.map((b, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(b.data) }}
        />
      ))}
    </>
  );
}
