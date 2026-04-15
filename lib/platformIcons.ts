import {
    Github,
    Linkedin,
    Globe,
    Code2,
    Youtube,
    Twitter,
    Facebook,
    Instagram,
    Twitch,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";

import {
  SiHashnode,
  SiDevdotto,
  SiMedium,
  SiDribbble,
} from "react-icons/si";

export const PLATFORM_ICONS: Record<string, any> = {
    github: Github,
    linkedin: Linkedin,
    leetcode: Code2,
    website: Globe,
    portfolio: Globe,
    youtube: Youtube,
    x: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    twitch: Twitch,
    hashnode: SiHashnode,
    devto: SiDevdotto,
    medium: SiMedium,
    dribbble: SiDribbble,
    discord: FaDiscord,
};
