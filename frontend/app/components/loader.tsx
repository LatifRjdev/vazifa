export const Loader = ({ message }: { message?: string }) => {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-gray-900 dark:border-white" />
      {message && (
        <div className="ml-3 mt-2 text-base font-medium text-gray-900 dark:text-white">
          {message}
        </div>
      )}
    </div>
  );
};

export const Error = () => {
  return <div>Ошибка</div>;
};
