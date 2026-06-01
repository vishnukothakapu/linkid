type PresetAvatar = {
    id: string;
    name: string;
    category: "Animal" | "Abstract" | "Minimal" | "Geometric";
    src: string;
};

function avatarSvg(background: string, content: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="100" fill="${background}"/>${content}</svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const presetAvatars: PresetAvatar[] = [
    {
        id: "fox",
        name: "Fox",
        category: "Animal",
        src: avatarSvg(
            "#f97316",
            '<path d="M45 68 75 36l15 34h20l15-34 30 32-16 76-39 25-39-25Z" fill="#fff7ed"/><path d="M67 82h66l-12 45-21 14-21-14Z" fill="#fb923c"/><circle cx="78" cy="102" r="7" fill="#111827"/><circle cx="122" cy="102" r="7" fill="#111827"/><path d="m92 121 8 8 8-8Z" fill="#111827"/>'
        ),
    },
    {
        id: "cat",
        name: "Cat",
        category: "Animal",
        src: avatarSvg(
            "#0f766e",
            '<path d="M55 84 66 48l29 24h10l29-24 11 36v37c0 27-20 47-45 47s-45-20-45-47Z" fill="#ccfbf1"/><circle cx="80" cy="103" r="7" fill="#0f172a"/><circle cx="120" cy="103" r="7" fill="#0f172a"/><path d="M94 123h12l-6 7Z" fill="#0f172a"/><path d="M80 136c10 8 30 8 40 0" stroke="#0f172a" stroke-width="7" stroke-linecap="round" fill="none"/>'
        ),
    },
    {
        id: "bear",
        name: "Bear",
        category: "Animal",
        src: avatarSvg(
            "#92400e",
            '<circle cx="62" cy="70" r="24" fill="#fde68a"/><circle cx="138" cy="70" r="24" fill="#fde68a"/><circle cx="100" cy="106" r="58" fill="#fef3c7"/><circle cx="79" cy="103" r="7" fill="#1f2937"/><circle cx="121" cy="103" r="7" fill="#1f2937"/><ellipse cx="100" cy="124" rx="19" ry="14" fill="#d97706"/><circle cx="100" cy="119" r="6" fill="#1f2937"/>'
        ),
    },
    {
        id: "wave",
        name: "Wave",
        category: "Abstract",
        src: avatarSvg(
            "#155e75",
            '<path d="M0 125c35-31 61-35 100-12s72 15 100-16v103H0Z" fill="#67e8f9"/><path d="M0 83c42 21 74 23 112 0s61-23 88-5v52c-35 27-69 31-108 8S31 111 0 139Z" fill="#cffafe" opacity=".92"/><circle cx="143" cy="57" r="22" fill="#facc15"/>'
        ),
    },
    {
        id: "orbit",
        name: "Orbit",
        category: "Abstract",
        src: avatarSvg(
            "#312e81",
            '<circle cx="100" cy="100" r="34" fill="#a5b4fc"/><ellipse cx="100" cy="100" rx="76" ry="30" fill="none" stroke="#f8fafc" stroke-width="10"/><ellipse cx="100" cy="100" rx="30" ry="76" fill="none" stroke="#c4b5fd" stroke-width="10"/><circle cx="148" cy="77" r="12" fill="#f97316"/>'
        ),
    },
    {
        id: "spark",
        name: "Spark",
        category: "Abstract",
        src: avatarSvg(
            "#7f1d1d",
            '<path d="M100 28 119 82l54 18-54 18-19 54-18-54-54-18 54-18Z" fill="#fecaca"/><circle cx="54" cy="55" r="10" fill="#fde68a"/><circle cx="148" cy="147" r="13" fill="#fb7185"/>'
        ),
    },
    {
        id: "person",
        name: "Person",
        category: "Minimal",
        src: avatarSvg(
            "#334155",
            '<circle cx="100" cy="73" r="31" fill="#f8fafc"/><path d="M47 163c7-35 28-54 53-54s46 19 53 54Z" fill="#f8fafc"/>'
        ),
    },
    {
        id: "smile",
        name: "Smile",
        category: "Minimal",
        src: avatarSvg(
            "#166534",
            '<circle cx="100" cy="100" r="62" fill="#dcfce7"/><circle cx="78" cy="87" r="8" fill="#052e16"/><circle cx="122" cy="87" r="8" fill="#052e16"/><path d="M72 118c14 18 42 18 56 0" stroke="#052e16" stroke-width="9" stroke-linecap="round" fill="none"/>'
        ),
    },
    {
        id: "initial",
        name: "Initial",
        category: "Minimal",
        src: avatarSvg(
            "#4338ca",
            '<circle cx="100" cy="100" r="58" fill="#eef2ff"/><path d="M74 137V63h20l32 42V63h20v74h-20L94 95v42Z" fill="#4338ca"/>'
        ),
    },
    {
        id: "tiles",
        name: "Tiles",
        category: "Geometric",
        src: avatarSvg(
            "#111827",
            '<rect x="47" y="47" width="48" height="48" rx="11" fill="#38bdf8"/><rect x="105" y="47" width="48" height="48" rx="11" fill="#f97316"/><rect x="47" y="105" width="48" height="48" rx="11" fill="#a3e635"/><rect x="105" y="105" width="48" height="48" rx="11" fill="#f9a8d4"/>'
        ),
    },
    {
        id: "prism",
        name: "Prism",
        category: "Geometric",
        src: avatarSvg(
            "#f8fafc",
            '<path d="M100 32 165 70v75l-65 23-65-23V70Z" fill="#0f172a"/><path d="M100 32v136l65-98Z" fill="#06b6d4"/><path d="M35 70l65 98V32Z" fill="#f59e0b"/><path d="m35 145 65 23 65-23-65-43Z" fill="#22c55e"/>'
        ),
    },
    {
        id: "rings",
        name: "Rings",
        category: "Geometric",
        src: avatarSvg(
            "#581c87",
            '<circle cx="75" cy="78" r="34" fill="none" stroke="#f0abfc" stroke-width="16"/><circle cx="123" cy="78" r="34" fill="none" stroke="#fef08a" stroke-width="16"/><circle cx="100" cy="122" r="34" fill="none" stroke="#86efac" stroke-width="16"/>'
        ),
    },
];
