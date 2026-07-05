// NOTE: these must come from "@phosphor-icons/react/dist/ssr/*", not the
// root "@phosphor-icons/react" package. The root package's icon base uses
// createContext, which crashes when evaluated inside Server Component
// chunks (e.g. "Failed to collect page data for /about"). The /ssr paths
// export the same *Icon-suffixed names without that dependency.
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretUpIcon } from "@phosphor-icons/react/dist/ssr/CaretUp";
import { CaretUpDownIcon } from "@phosphor-icons/react/dist/ssr/CaretUpDown";
import { ChartBarIcon } from "@phosphor-icons/react/dist/ssr/ChartBar";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CircleIcon } from "@phosphor-icons/react/dist/ssr/Circle";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { CrosshairIcon } from "@phosphor-icons/react/dist/ssr/Crosshair";
import { CurrencyCircleDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyCircleDollar";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { EyedropperIcon } from "@phosphor-icons/react/dist/ssr/Eyedropper";
import { FacebookLogoIcon } from "@phosphor-icons/react/dist/ssr/FacebookLogo";
import { GameControllerIcon } from "@phosphor-icons/react/dist/ssr/GameController";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { HandFistIcon } from "@phosphor-icons/react/dist/ssr/HandFist";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr/InstagramLogo";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { MegaphoneIcon } from "@phosphor-icons/react/dist/ssr/Megaphone";
import { MoonIcon } from "@phosphor-icons/react/dist/ssr/Moon";
import { NewspaperIcon } from "@phosphor-icons/react/dist/ssr/Newspaper";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr/Package";
import { PhoneIcon } from "@phosphor-icons/react/dist/ssr/Phone";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { ShoppingBagIcon } from "@phosphor-icons/react/dist/ssr/ShoppingBag";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { SunIcon } from "@phosphor-icons/react/dist/ssr/Sun";
import { SwordIcon } from "@phosphor-icons/react/dist/ssr/Sword";
import { TiktokLogoIcon } from "@phosphor-icons/react/dist/ssr/TiktokLogo";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr/XCircle";
import { YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr/YoutubeLogo";

export const Icons = {
  Layout: {
    Navigation: {
      Home: HouseIcon,
      Menu: ListIcon,
      Close: XIcon,
      CaretRight: CaretRightIcon,
    },
    Theme: {
      Sun: SunIcon,
      Dark: MoonIcon,
    },
    ScrollTop: CaretUpIcon,
  },

  Social: {
    Facebook: FacebookLogoIcon,
    Instagram: InstagramLogoIcon,
    Linkedin: LinkedinLogoIcon,
    Youtube: YoutubeLogoIcon,
    Tiktok: TiktokLogoIcon,
  },

  Contact: {
    Email: EnvelopeSimpleIcon,
    Phone: PhoneIcon,
    Location: MapPinIcon,
    ExternalLink: ArrowSquareOutIcon,
  },

  Status: {
    Success: CheckCircleIcon,
    Pending: CircleIcon,
    Failed: XCircleIcon,
  },

  Stats: {
    Squads: UsersThreeIcon,
    Trophies: TrophyIcon,
    Players: UserIcon,
    Goal: CrosshairIcon,
  },

  Domain: {
    Squads: SquaresFourIcon,
    Members: UsersFourIcon,
    Players: GameControllerIcon,
    Scrims: SwordIcon,
    Calendar: CalendarBlankIcon,
    Announcements: MegaphoneIcon,
    Recruitment: ClipboardTextIcon,
    Products: PackageIcon,
    Orders: ReceiptIcon,
    Revenue: CurrencyCircleDollarIcon,
    Community: HandFistIcon,
    Lightning: LightningIcon,
    News: NewspaperIcon,
    Shop: ShoppingBagIcon,
    Reports: ChartBarIcon,
  },

  Actions: {
    Add: PlusIcon,
    Delete: TrashIcon,
    Eyedropper: EyedropperIcon,
    SignOut: SignOutIcon,
    Settings: GearIcon,
    CaretUpDown: CaretUpDownIcon,
  },
} as const;
