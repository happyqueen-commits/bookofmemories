export function SearchForm({ placeholder = "Поиск", defaultValue = "" }: { placeholder?: string; defaultValue?: string }) {
  return (
    <form className="mb-1 flex flex-col gap-2.5 sm:flex-row sm:items-center" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#c8ae8d] bg-[#fffef9] px-4 py-3 text-[#3f2e1f] shadow-[inset_0_1px_1px_rgb(70_45_22_/_0.06)] transition duration-200 ease-out placeholder:text-[#8f7555] hover:border-[#b99a73] focus-visible:border-[#9b5d4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a46857]/30"
        aria-label={placeholder}
      />
      <button
        className="interactive-lift rounded-lg border border-[#8e382f] bg-accent px-5 py-3 text-sm font-semibold tracking-[0.01em] text-[#fff8ef] shadow-[0_4px_10px_rgb(87_32_26_/_0.18)] transition-colors hover:bg-[#7a281f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b2017] focus-visible:ring-offset-2 sm:min-w-28"
        type="submit"
      >
        Найти
      </button>
    </form>
  );
}
