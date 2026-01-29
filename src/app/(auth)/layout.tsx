export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700">네오인증서</h1>
          <p className="mt-1 text-sm text-gray-500">의료기기 정품 인증 시스템</p>
        </div>
        {children}
      </div>
    </div>
  );
}
