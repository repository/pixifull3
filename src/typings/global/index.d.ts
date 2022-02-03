declare module "markdown-truncate" {
  export default function (
    input: string,
    options: {
      limit: number;
      ellipsis: boolean;
    },
  ): string;
}
