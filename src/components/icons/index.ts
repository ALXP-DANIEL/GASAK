// NOTE: these must come from "@phosphor-icons/react/dist/ssr/*", not the
// root "@phosphor-icons/react" package. The root package's icon base uses
// createContext, which crashes when evaluated inside Server Component
// chunks (e.g. "Failed to collect page data for /about"). The /ssr paths
// export the same *Icon-suffixed names without that dependency.
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight";
import { ArrowsOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowsOut";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretUpIcon } from "@phosphor-icons/react/dist/ssr/CaretUp";
import { CaretUpDownIcon } from "@phosphor-icons/react/dist/ssr/CaretUpDown";
import { ChartBarIcon } from "@phosphor-icons/react/dist/ssr/ChartBar";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CircleIcon } from "@phosphor-icons/react/dist/ssr/Circle";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { CodeIcon } from "@phosphor-icons/react/dist/ssr/Code";
import { CrosshairIcon } from "@phosphor-icons/react/dist/ssr/Crosshair";
import { CurrencyCircleDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyCircleDollar";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { EyedropperIcon } from "@phosphor-icons/react/dist/ssr/Eyedropper";
import { FacebookLogoIcon } from "@phosphor-icons/react/dist/ssr/FacebookLogo";
import { GameControllerIcon } from "@phosphor-icons/react/dist/ssr/GameController";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { HandFistIcon } from "@phosphor-icons/react/dist/ssr/HandFist";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { ImageIcon } from "@phosphor-icons/react/dist/ssr/Image";
import { InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr/InstagramLogo";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { LinkBreakIcon } from "@phosphor-icons/react/dist/ssr/LinkBreak";
import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr/LinkSimple";
import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { ListBulletsIcon } from "@phosphor-icons/react/dist/ssr/ListBullets";
import { ListNumbersIcon } from "@phosphor-icons/react/dist/ssr/ListNumbers";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { MoonIcon } from "@phosphor-icons/react/dist/ssr/Moon";
import { NewspaperIcon } from "@phosphor-icons/react/dist/ssr/Newspaper";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr/Package";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { PhoneIcon } from "@phosphor-icons/react/dist/ssr/Phone";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { QuotesIcon } from "@phosphor-icons/react/dist/ssr/Quotes";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { RocketLaunchIcon } from "@phosphor-icons/react/dist/ssr/RocketLaunch";
import { ShoppingBagIcon } from "@phosphor-icons/react/dist/ssr/ShoppingBag";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { SunIcon } from "@phosphor-icons/react/dist/ssr/Sun";
import { SwordIcon } from "@phosphor-icons/react/dist/ssr/Sword";
import { TextBIcon } from "@phosphor-icons/react/dist/ssr/TextB";
import { TextHOneIcon } from "@phosphor-icons/react/dist/ssr/TextHOne";
import { TextHThreeIcon } from "@phosphor-icons/react/dist/ssr/TextHThree";
import { TextHTwoIcon } from "@phosphor-icons/react/dist/ssr/TextHTwo";
import { TextItalicIcon } from "@phosphor-icons/react/dist/ssr/TextItalic";
import { TextStrikethroughIcon } from "@phosphor-icons/react/dist/ssr/TextStrikethrough";
import { TextUnderlineIcon } from "@phosphor-icons/react/dist/ssr/TextUnderline";
import { TiktokLogoIcon } from "@phosphor-icons/react/dist/ssr/TiktokLogo";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { TreeStructureIcon } from "@phosphor-icons/react/dist/ssr/TreeStructure";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { TShirtIcon } from "@phosphor-icons/react/dist/ssr/TShirt";
import { UploadSimpleIcon } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UserGearIcon } from "@phosphor-icons/react/dist/ssr/UserGear";
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
    Locked: LockSimpleIcon,
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
    Recruitment: ClipboardTextIcon,
    Products: PackageIcon,
    Orders: ReceiptIcon,
    Joki: RocketLaunchIcon,
    Merchandise: TShirtIcon,
    Revenue: CurrencyCircleDollarIcon,
    Community: HandFistIcon,
    Lightning: LightningIcon,
    News: NewspaperIcon,
    Shop: ShoppingBagIcon,
    Reports: ChartBarIcon,
    Accounts: UserGearIcon,
    Hierarchy: TreeStructureIcon,
    Audit: ClockCounterClockwiseIcon,
    Time: ClockIcon,
  },

  Actions: {
    Add: PlusIcon,
    Minus: MinusIcon,
    Edit: PencilSimpleIcon,
    Delete: TrashIcon,
    Eyedropper: EyedropperIcon,
    SignOut: SignOutIcon,
    Settings: GearIcon,
    CaretUpDown: CaretUpDownIcon,
    SwitchFocus: ArrowsLeftRightIcon,
    Fit: ArrowsOutIcon,
    Upload: UploadSimpleIcon,
  },

  Editor: {
    Bold: TextBIcon,
    Italic: TextItalicIcon,
    Underline: TextUnderlineIcon,
    Strikethrough: TextStrikethroughIcon,
    H1: TextHOneIcon,
    H2: TextHTwoIcon,
    H3: TextHThreeIcon,
    Quote: QuotesIcon,
    BulletList: ListBulletsIcon,
    OrderedList: ListNumbersIcon,
    Code: CodeIcon,
    Link: LinkSimpleIcon,
    Unlink: LinkBreakIcon,
    HorizontalRule: MinusIcon,
    Image: ImageIcon,
    Undo: ArrowCounterClockwiseIcon,
    Redo: ArrowClockwiseIcon,
  },
} as const;
