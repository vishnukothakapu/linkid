import {
    Github,
    Linkedin,
    Globe,
    Code2,
    Youtube,
    Facebook,
    Instagram,
    Twitch,
} from "lucide-react";

import { FaDiscord, FaDribbble, FaMedium } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import {
    SiHashnode,
    SiDevdotto,
    SiCodechef,
    SiCodeforces,
} from "react-icons/si";

import type { ComponentType, SVGProps } from "react";

export const PLATFORMS = {
    github: { icon: Github, name: "GitHub" },
    linkedin: { icon: Linkedin, name: "LinkedIn" },
    leetcode: { icon: Code2, name: "LeetCode" },
    website: { icon: Globe, name: "Website" },
    portfolio: { icon: Globe, name: "Portfolio" },
    youtube: { icon: Youtube, name: "YouTube" },
    x: { icon: FaXTwitter, name: "X" },
    facebook: { icon: Facebook, name: "Facebook" },
    instagram: { icon: Instagram, name: "Instagram" },
    twitch: { icon: Twitch, name: "Twitch" },
    discord: { icon: FaDiscord, name: "Discord" },
    hashnode: { icon: SiHashnode, name: "Hashnode" },
    devto: { icon: SiDevdotto, name: "Dev.to" },
    medium: { icon: FaMedium, name: "Medium" },
    dribbble: { icon: FaDribbble, name: "Dribbble" },
    codechef: { icon: SiCodechef, name: "CodeChef" },
    codeforces: { icon: SiCodeforces, name: "Codeforces" },
} as const;

export const PLATFORM_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> =
    Object.fromEntries(
        Object.entries(PLATFORMS).map(([key, value]) => [key, value.icon])
    ) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export const PLATFORM_NAMES: Record<string, string> =
    Object.fromEntries(
        Object.entries(PLATFORMS).map(([key, value]) => [key, value.name])
    ) as Record<string, string>;