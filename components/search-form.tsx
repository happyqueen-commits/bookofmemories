export function SearchForm({ placeholder = "Поиск", defaultValue = "" }: { placeholder?: string; defaultValue?: string }) {
  return (
    <form className="mb-1 flex flex-col gap-2 sm:flex-row" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#c4a785] bg-[#fffdf7] px-4 py-3 text-[#3f2e1f] shadow-[inset_0_1px_1px_rgb(70_45_22_/_0.06)] transition-shadow duration-200 ease-out placeholder:text-[#8f7555] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={placeholder}
      />
      <button className="interactive-lift rounded-md bg-accent px-5 py-3 text-sm font-semibold tracking-[0.01em] text-[#fff8ef] shadow-sm transition-colors hover:bg-[#7a281f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b2017] focus-visible:ring-offset-2" type="submit">Найти</button>
    </form>
  );
}
