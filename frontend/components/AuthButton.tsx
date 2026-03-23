export default function AuthButton({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-3 rounded border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-black shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}
