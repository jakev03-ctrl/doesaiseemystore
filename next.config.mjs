// Reports, comparisons and the demo animation should never appear in search results,
// even if someone shares a link to them.
const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

export default {
  async headers() {
    return [
      { source: "/report/:path*", headers: noindex },
      { source: "/compare/:path*", headers: noindex },
      { source: "/media/:path*", headers: noindex },
    ];
  },
};
