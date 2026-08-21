import { supabase } from
    return await uploadOriginal(file);
  } catch (error) {
    console.warn("Storage недоступен, используем WebP fallback:", error);
    return optimizedDataUrl(file, maxDimension);
  }
}
