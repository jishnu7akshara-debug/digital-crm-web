/**
 * Digital Footprint OS Design Tokens (v3: Salesforce Lightning Enterprise Theme).
 * Change here to update colors across the entire system.
 */
export const themeTokens = {
  colors: {
    brandBlue: "#0176D3",
    brandBlueHover: "#014486",
    navy: "#032D60",
    headerTint: "#EAF5FE",
    canvas: "#F3F3F3",
    border: "#DDDBDA",
    text: "#181818",
    secondaryText: "#5C5C5C",
    white: "#FFFFFF",
    success: "#2E844A",
    successBg: "#EBF7E6",
    warning: "#8A5200",
    warningBg: "#FEF1D6",
    error: "#BA0517",
    errorBg: "#FEDED8",
    // Salesforce Object Tile Colors (36px rounded square)
    objectTiles: {
      lead: "#F88962",       // Orange
      account: "#7F8DE1",    // Indigo/Purple
      project: "#3BA755",    // Green
      agreement: "#4BC076",  // Mint/Emerald Green
      opportunity: "#FCB95B", // Amber
      invoice: "#5B8FF9",    // Blue
    },
  },
  dimensions: {
    headerHeight: "48px",
    appBarHeight: "40px",
    portalHeaderHeight: "56px",
    searchWidth: "440px",
    tileRadius: "4px",
    cardRadius: "4px",
    baseFontSize: "13px",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
} as const;
