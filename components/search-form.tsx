export function SearchForm({ placeholder = "Поиск", defaultValue = "" }: { placeholder?: string; defaultValue?: string }) {
  return (
    <form className="mb-1 flex gap-2" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-sm border border-[#bea27d] bg-[#fffdf6] px-3 py-2 text-[#3f2e1f] transition-shadow duration-200 ease-out placeholder:text-[#8f7555] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={placeholder}
      />
      <button className="interactive-lift rounded-sm bg-accent px-4 py-2 text-[#fff8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b2017] focus-visible:ring-offset-2" type="submit">Найти</button>
    </form>
  );
}
