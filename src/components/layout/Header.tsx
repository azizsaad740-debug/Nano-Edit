import { Image as ImageIcon } from "lucide-react";

const Header = () => {
  return (
    <header className="flex items-center h-16 px-4 md:px-6 border-b shrink-0">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">NanoEdit</h1>
      </div>
    </header>
  );
};

export default Header;