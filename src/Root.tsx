import React from "react";
import { Composition } from "remotion";
import { theme } from "./theme";
import { PlaceOnReady } from "./videos/PlaceOnReady";
import { VisibleWorkshop } from "./videos/VisibleWorkshop";
import { OneKanban } from "./videos/OneKanban";
import { Blocked } from "./videos/Blocked";
import { WaitQuota } from "./videos/WaitQuota";
import { TeamBid } from "./videos/TeamBid";
import { StrangerComment } from "./videos/StrangerComment";
import { FlatRate } from "./videos/FlatRate";
import { Resume } from "./videos/Resume";
import { DirectChat } from "./videos/DirectChat";

// 10本の動画を Composition として並べる。各回の中身は src/videos/ の同じ名前のファイル
export const Root: React.FC = () => (
  <>
    <Composition
      id="place-on-ready"
      component={PlaceOnReady}
      durationInFrames={theme.fps * theme.durationInSeconds}
      fps={theme.fps}
      width={theme.size}
      height={theme.size}
    />
    <Composition id="visible-workshop" component={VisibleWorkshop} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="one-kanban" component={OneKanban} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="blocked" component={Blocked} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="wait-quota" component={WaitQuota} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="team-bid" component={TeamBid} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="stranger-comment" component={StrangerComment} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="flat-rate" component={FlatRate} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="resume" component={Resume} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
    <Composition id="direct-chat" component={DirectChat} durationInFrames={theme.fps * theme.durationInSeconds} fps={theme.fps} width={theme.size} height={theme.size} />
  </>
);
