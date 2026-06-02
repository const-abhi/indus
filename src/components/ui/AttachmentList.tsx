import { FileText, Link2, Image } from "lucide-react";
import type { Attachment } from "@/lib/validations";

interface Props {
  attachments: Attachment[];
}

function AttachmentIcon({ type, name }: { type: string; name: string }) {
  if (type === "link") return <Link2 className="w-4 h-4 text-blue-500 shrink-0" />;
  if (name.match(/\.(png|jpg|jpeg|gif|webp)$/i))
    return <Image className="w-4 h-4 text-purple-500 shrink-0" />;
  return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
}

export default function AttachmentList({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Attachments</p>
      <ul className="space-y-1.5">
        {attachments.map((att, i) => (
          <li key={i}>
            <a
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <AttachmentIcon type={att.type} name={att.name} />
              <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-[#1a1a2e]">
                {att.name}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {att.type === "link" ? "Link" : "File"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
