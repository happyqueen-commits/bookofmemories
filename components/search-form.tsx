export function SearchForm({ placeholder = "Поиск", defaultValue = "" }: { placeholder?: string; defaultValue?: string }) {
  return (
    <form className="mb-6 flex gap-2" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2"
        aria-label={placeholder}
      />
      <button className="rounded bg-slate-800 px-4 py-2 text-white" type="submit">Найти</button>
    </form>
  );
}
