import { LabIcon } from "@jupyterlab/ui-components";

// Metanno logo on the source and recipe view tabs
export const metannoIcon = new LabIcon({
  name: "metanno:tab",
  svgstr:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-0.5 -0.5 115 123">' +
    '<rect x="4" y="22" width="106" height="96" rx="8.64" fill="#dae8fc" stroke="#6c8ebf" stroke-width="9"/>' +
    '<rect x="16" y="4" width="65" height="54" rx="4.86" fill="#ffffff" stroke="#6c8ebf" stroke-width="9"/></svg>',
});

// Sidebar tab icon, a LabIcon since JupyterLab 4 draws tab icons as inline SVG, grays keep the former look
export const metannoSidebarIcon = new LabIcon({
  name: "metanno:viewer",
  svgstr:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-0.5 -0.5 115 123">' +
    '<rect x="4" y="22" width="106" height="96" rx="8.64" fill="#e6e6e6" stroke="#8a8a8a" stroke-width="9"/>' +
    '<rect x="16" y="4" width="65" height="54" rx="4.86" fill="#ffffff" stroke="#8a8a8a" stroke-width="9"/></svg>',
});
