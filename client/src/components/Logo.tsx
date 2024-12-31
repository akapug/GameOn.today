
export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 25.2c-6.188 0-11.2-5.012-11.2-11.2S9.812 4.8 16 4.8 27.2 9.812 27.2 16 22.188 27.2 16 27.2z" fill="currentColor"/>
        <path d="M20.5 15h-3.5v-3.5c0-.552-.448-1-1-1s-1 .448-1 1V15h-3.5c-.552 0-1 .448-1 1s.448 1 1 1H15v3.5c0 .552.448 1 1 1s1-.448 1-1V17h3.5c.552 0 1-.448 1-1s-.448-1-1-1z" fill="currentColor"/>
      </svg>
      <span className="font-bold text-xl">GameOn</span>
    </div>
  );
}
