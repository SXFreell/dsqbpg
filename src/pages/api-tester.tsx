import { useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function ApiTesterPage() {
  const responseRef = useRef<HTMLTextAreaElement>(null);
  const [method, setMethod] = useState<string>("GET");
  const [endpoint, setEndpoint] = useState("/api/hello");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    try {
      const url = new URL(endpoint, location.href);
      const res = await fetch(url, { method });

      const contentType = res.headers.get("content-type");
      let data: unknown;
      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse(
        typeof data === "string" ? data : JSON.stringify(data, null, 2)
      );
    } catch (error) {
      setResponse(String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Tester</CardTitle>
          <CardDescription>
            Send requests to test your API endpoints directly from the browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={testEndpoint} className="space-y-4">
            <div className="flex gap-3">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/hello"
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            ref={responseRef}
            value={response}
            readOnly
            placeholder="Response will appear here..."
            className="min-h-[200px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
