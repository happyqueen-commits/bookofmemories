export function SearchForm({ placeholder = "Поиск", defaultValue = "" }: { placeholder?: string; defaultValue?: string }) {
  return (
    <form className="mb-6 flex gap-2" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 transition-shadow duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        aria-label={placeholder}
      />
      <button className="interactive-lift rounded bg-slate-800 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2" type="submit">Найти</button>
    </form>
  );
}
