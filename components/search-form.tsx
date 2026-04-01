export function SearchForm({ placeholder = "Поиск", defaultValue = "" }: { placeholder?: string; defaultValue?: string }) {
  return (
    <form className="mb-6 flex gap-2" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded border border-patriot-blue/25 bg-white px-3 py-2 transition-shadow duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patriot-blue/40 focus-visible:ring-offset-2"
        aria-label={placeholder}
      />
      <button className="interactive-lift rounded bg-gradient-to-r from-patriot-blue to-patriot-red px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patriot-blue/50 focus-visible:ring-offset-2" type="submit">Найти</button>
    </form>
  );
}
