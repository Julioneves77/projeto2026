import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
const Header = () => {
  return <header className="w-full bg-background">
      {/* Top bar */}
      <div className="border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-primary">
              Portal Certidão
            </span>
          </Link>
          
          <Link to="/contato">
            <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium px-6">
              Contato
            </Button>
          </Link>
        </div>
      </div>
    </header>;
};
export default Header;