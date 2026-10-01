const SUPABASE_URL = "https://vcstrvqubskhnvococjs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Pkv5q3IjDqhGCApiE8xr2Q_rURmjGMw";

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return "";
  }
  return auth.slice(7).trim();
}

async function verifyAdmin(accessToken) {
  const authHeaders = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`
  };

  const userResponse = await fetch(
    `${SUPABASE_URL}/auth/v1/user`,
    { headers: authHeaders }
  );

  if (!userResponse.ok) {
    return { ok: false, status: 401 };
  }

  const user = await userResponse.json();

  if (!user || !user.id) {
    return { ok: false, status: 401 };
  }

  const adminUrl =
    `${SUPABASE_URL}/rest/v1/admins` +
    `?user_id=eq.${encodeURIComponent(user.id)}` +
    `&select=user_id&limit=1`;

  const adminResponse = await fetch(
    adminUrl,
    { headers: authHeaders }
  );

  if (!adminResponse.ok) {
    return { ok: false, status: 403 };
  }

  const rows = await adminResponse.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, status: 403 };
  }

  return { ok: true, user };
}

function extractOutputText(responseData) {
  const chunks = [];

  for (const item of responseData?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function cleanJsonText(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, {
      error: "Chỉ hỗ trợ phương thức POST."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      error: "Chưa cấu hình OPENAI_API_KEY trên Vercel."
    });
  }

  const accessToken = getBearerToken(req);

  if (!accessToken) {
    return sendJson(res, 401, {
      error: "Bạn cần đăng nhập quản trị."
    });
  }

  try {
    const adminCheck = await verifyAdmin(accessToken);

    if (!adminCheck.ok) {
      return sendJson(
        res,
        adminCheck.status,
        {
          error:
            adminCheck.status === 401
              ? "Phiên đăng nhập không hợp lệ."
              : "Tài khoản không có quyền quản trị."
        }
      );
    }

    const {
      title = "",
      excerpt = "",
      content = ""
    } = req.body || {};

    const cleanTitle = String(title).trim();
    const cleanExcerpt = String(excerpt).trim();
    const cleanContent = String(content).trim();

    if (!cleanTitle) {
      return sendJson(res, 400, {
        error: "Bài viết chưa có tiêu đề tiếng Việt."
      });
    }

    if (!cleanContent) {
      return sendJson(res, 400, {
        error: "Bài viết chưa có nội dung tiếng Việt."
      });
    }

    const totalChars =
      cleanTitle.length +
      cleanExcerpt.length +
      cleanContent.length;

    if (totalChars > 60000) {
      return sendJson(res, 413, {
        error: "Bài viết quá dài để dịch trong một lần."
      });
    }

    const source = {
      title: cleanTitle,
      excerpt: cleanExcerpt,
      content: cleanContent
    };

    const instructions = [
      "Translate this Vietnamese heritage/news article into natural, faithful English.",
      "Do not add, remove, summarize, reinterpret, or invent facts.",
      "Preserve proper names, dates, place names, historical terms, paragraph breaks, and the original level of detail.",
      "Use clear English suitable for an international heritage website.",
      "Return ONLY a valid JSON object with exactly these string keys:",
      '"title_en", "excerpt_en", "content_en".',
      "If excerpt is empty, return excerpt_en as an empty string."
    ].join(" ");

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model:
            process.env.OPENAI_TRANSLATION_MODEL ||
            "gpt-5.6-luna",
          instructions,
          input:
            "Vietnamese source article:\n" +
            JSON.stringify(source),
          store: false
        })
      }
    );

    const responseData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error(
        "OpenAI translation error:",
        responseData
      );

      return sendJson(res, 502, {
        error:
          responseData?.error?.message ||
          "Không thể dịch bài viết lúc này."
      });
    }

    const outputText =
      extractOutputText(responseData);

    if (!outputText) {
      return sendJson(res, 502, {
        error: "Dịch vụ dịch không trả về nội dung."
      });
    }

    let translated;

    try {
      translated = JSON.parse(
        cleanJsonText(outputText)
      );
    } catch (error) {
      console.error(
        "Invalid translation JSON:",
        outputText
      );

      return sendJson(res, 502, {
        error:
          "Kết quả dịch chưa đúng định dạng. Vui lòng thử lại."
      });
    }

    const titleEn =
      String(
        translated?.title_en || ""
      ).trim();

    const excerptEn =
      String(
        translated?.excerpt_en || ""
      ).trim();

    const contentEn =
      String(
        translated?.content_en || ""
      ).trim();

    if (!titleEn || !contentEn) {
      return sendJson(res, 502, {
        error:
          "Kết quả dịch còn thiếu tiêu đề hoặc nội dung."
      });
    }

    return sendJson(res, 200, {
      title_en: titleEn,
      excerpt_en: excerptEn,
      content_en: contentEn
    });

  } catch (error) {
    console.error(
      "Translate article handler error:",
      error
    );

    return sendJson(res, 500, {
      error:
        "Có lỗi khi dịch bài viết. Vui lòng thử lại."
    });
  }
};
