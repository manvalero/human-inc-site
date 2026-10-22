// Shared HIOBS copy/native-share utility. No third-party services.
window.HIOBSShare = {
  async share(url, title, status) {
    if (status) status.textContent = "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const field = document.createElement("textarea");
        field.value = url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Clipboard copy was declined");
      }
      if (status) status.textContent = "Link copied.";
    } catch {
      if (status) status.textContent = "Link could not be copied. Select the page address to share.";
    }
  }
};
