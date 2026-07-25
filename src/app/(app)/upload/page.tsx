import { UploadZone } from "@/components/upload/UploadZone";

export default function UploadPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Upload to Library</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add books and documents to your personal collection
        </p>
      </div>
      <UploadZone />
    </div>
  );
}
