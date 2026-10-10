import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODEL = "gemini-3.8-flash";

const MAX_RETRIES = 3;

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type RequestBody = {
  message?: string;
  context?: Record<string, unknown>;
  history?: ChatHistoryItem[];
};

function sleep(ms: number) {
  return new Promise(resolve =>
    setTimeout(resolve, ms),
  );
}

function makeJsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

function buildContextText(
  context: Record<string, unknown>,
) {
  const entries =
    Object.entries(context);

  if (entries.length === 0) {
    return "현재 별도의 상권 분석 결과가 전달되지 않았습니다.";
  }

  return entries
    .map(([key, value]) => {
      if (
        value === null ||
        value === undefined
      ) {
        return null;
      }

      if (
        typeof value === "object"
      ) {
        try {
          return `${key}: ${JSON.stringify(
            value,
          )}`;
        } catch {
          return `${key}: ${String(
            value,
          )}`;
        }
      }

      return `${key}: ${String(value)}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildGeminiContents(
  message: string,
  context: Record<string, unknown>,
  history: ChatHistoryItem[],
) {
  const contextText =
    buildContextText(context);

  const systemPrompt = `
당신은 예비 창업자를 돕는 한국어 상권 분석 AI입니다.

사용자가 제공한 상권 분석 결과와 대화 내용을 바탕으로 답변하세요.

답변 원칙:
1. 항상 한국어로 답변합니다.
2. 상권 분석 결과가 제공되었다면 그 데이터를 최우선 근거로 사용합니다.
3. 제공되지 않은 수치나 사실을 임의로 만들어내지 않습니다.
4. 어떤 지표가 좋은지 나쁜지 단정하기보다는 업종, 지역, 경쟁 상황을 함께 고려해 설명합니다.
5. 사용자가 이해하기 쉽도록 전문 용어를 풀어서 설명합니다.
6. 핵심 답변을 먼저 말하고, 필요한 경우 근거를 덧붙입니다.
7. 지나치게 긴 답변은 피합니다.
8. 창업 성공을 보장하거나 확정적으로 표현하지 않습니다.
9. 분석 데이터가 부족하면 어떤 정보가 추가로 필요한지 명확하게 말합니다.

현재 전달된 분석 정보:
${contextText}
`.trim();

  const contents: Array<{
    role: "user" | "model";
    parts: Array<{
      text: string;
    }>;
  }> = [
    {
      role: "user",
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text:
            "확인했습니다. 제공된 상권 분석 정보를 기준으로 답변하겠습니다.",
        },
      ],
    },
  ];

  for (
    const item of history
  ) {
    if (
      !item?.content?.trim()
    ) {
      continue;
    }

    contents.push({
      role:
        item.role === "assistant"
          ? "model"
          : "user",
      parts: [
        {
          text:
            item.content.trim(),
        },
      ],
    });
  }

  contents.push({
    role: "user",
    parts: [
      {
        text: message,
      },
    ],
  });

  return contents;
}

function getGeminiErrorMessage(
  data: any,
) {
  return (
    data?.error?.message ??
    data?.message ??
    "Gemini API 요청에 실패했습니다."
  );
}

function isRetryableStatus(
  status: number,
) {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function requestGemini(
  apiKey: string,
  body: Record<string, unknown>,
) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey,
    )}`;

  let lastStatus = 500;
  let lastMessage =
    "AI 응답을 불러오지 못했습니다.";

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt += 1
  ) {
    try {
      const response =
        await fetch(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(body),
          },
        );

      const rawText =
        await response.text();

      let data: any = {};

      if (rawText) {
        try {
          data =
            JSON.parse(rawText);
        } catch {
          data = {
            rawText,
          };
        }
      }

      if (response.ok) {
        return {
          ok: true as const,
          status:
            response.status,
          data,
        };
      }

      lastStatus =
        response.status;

      lastMessage =
        getGeminiErrorMessage(
          data,
        );

      console.error(
        `Gemini 요청 실패 (${attempt + 1}/${MAX_RETRIES + 1})`,
        {
          status:
            response.status,
          message:
            lastMessage,
        },
      );

      const canRetry =
        isRetryableStatus(
          response.status,
        );

      if (
        !canRetry ||
        attempt ===
          MAX_RETRIES
      ) {
        return {
          ok: false as const,
          status:
            response.status,
          message:
            lastMessage,
        };
      }

      const delayMs =
        1000 *
        2 ** attempt;

      await sleep(
        delayMs,
      );
    } catch (error) {
      lastStatus = 503;

      lastMessage =
        error instanceof Error
          ? error.message
          : "Gemini API 네트워크 요청에 실패했습니다.";

      console.error(
        `Gemini 네트워크 오류 (${attempt + 1}/${MAX_RETRIES + 1})`,
        error,
      );

      if (
        attempt ===
        MAX_RETRIES
      ) {
        return {
          ok: false as const,
          status:
            lastStatus,
          message:
            lastMessage,
        };
      }

      const delayMs =
        1000 *
        2 ** attempt;

      await sleep(
        delayMs,
      );
    }
  }

  return {
    ok: false as const,
    status: lastStatus,
    message: lastMessage,
  };
}

Deno.serve(
  async request => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        },
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return makeJsonResponse(
        {
          error:
            "POST 요청만 지원합니다.",
        },
        405,
      );
    }

    try {
      const apiKey =
        Deno.env.get(
          "GEMINI_API_KEY",
        );

      if (!apiKey) {
        console.error(
          "GEMINI_API_KEY가 설정되지 않았습니다.",
        );

        return makeJsonResponse(
          {
            error:
              "AI 서버 설정이 완료되지 않았습니다.",
          },
          500,
        );
      }

      let body: RequestBody;

      try {
        body =
          await request.json();
      } catch {
        return makeJsonResponse(
          {
            error:
              "요청 형식이 올바르지 않습니다.",
          },
          400,
        );
      }

      const message =
        typeof body.message ===
        "string"
          ? body.message.trim()
          : "";

      if (!message) {
        return makeJsonResponse(
          {
            error:
              "질문을 입력해주세요.",
          },
          400,
        );
      }

      const context =
        body.context &&
        typeof body.context ===
          "object" &&
        !Array.isArray(
          body.context,
        )
          ? body.context
          : {};

      const history =
        Array.isArray(
          body.history,
        )
          ? body.history.filter(
              item =>
                item &&
                (item.role ===
                  "user" ||
                  item.role ===
                    "assistant") &&
                typeof item.content ===
                  "string",
            )
          : [];

      const contents =
        buildGeminiContents(
          message,
          context,
          history,
        );

      const geminiBody = {
        contents,
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 1400,
        },
      };

      const result =
        await requestGemini(
          apiKey,
          geminiBody,
        );

      if (!result.ok) {
        console.error(
          "Gemini 최종 요청 실패:",
          {
            status:
              result.status,
            message:
              result.message,
          },
        );

        if (
          result.status ===
            429 ||
          result.status ===
            503 ||
          result.status ===
            504
        ) {
          return makeJsonResponse(
            {
              error:
                "현재 AI 사용량이 많아 답변이 지연되고 있어요. 잠시 후 다시 시도해주세요.",
            },
            503,
          );
        }

        return makeJsonResponse(
          {
            error:
              "AI 답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
          },
          500,
        );
      }

      const answer =
        result.data
          ?.candidates?.[0]
          ?.content?.parts
          ?.map(
            (
              part: {
                text?: string;
              },
            ) =>
              part?.text ?? "",
          )
          .join("")
          .trim();

      if (!answer) {
        console.error(
          "Gemini 응답에 답변 텍스트가 없습니다.",
          result.data,
        );

        return makeJsonResponse(
          {
            error:
              "AI 답변을 생성하지 못했습니다. 다시 질문해주세요.",
          },
          502,
        );
      }

      return makeJsonResponse(
        {
          answer,
        },
        200,
      );
    } catch (error) {
      console.error(
        "chat-assistant Edge Function 오류:",
        error,
      );

      return makeJsonResponse(
        {
          error:
            "AI 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
        500,
      );
    }
  },
);
