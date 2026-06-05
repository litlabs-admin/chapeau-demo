/** Fixed full-screen grain texture overlay for a tactile, premium feel. */
export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden opacity-[0.025] mix-blend-multiply"
    >
      <div className="bg-grain absolute inset-0" />
    </div>
  );
}
