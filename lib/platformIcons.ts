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
import { SiHashnode, SiDevdotto } from "react-icons/si";
import type { ComponentType, SVGProps } from "react";
import { SiCodeforces } from "react-icons/si";
import { SiCodechef } from "react-icons/si";
export const PLATFORM_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    github: Github,
    linkedin: Linkedin,
    leetcode: Code2,
    website: Globe,
    portfolio: Globe,
    youtube: Youtube,
    x: FaXTwitter,
    facebook: Facebook,
    instagram: Instagram,
    twitch: Twitch,
    discord: FaDiscord,
    hashnode: SiHashnode,
    devto: SiDevdotto,
    medium: FaMedium,
    dribbble: FaDribbble,
    codechef: SiCodechef,
    codeforces: SiCodeforces,
};
