import React from 'react';
import {Emoji} from '../commons/Emoji';
import {getStyleForTopLevelComponent} from '../../core/utils/getStyleForTopLevelComponent';
import '../styles/emoji.css';
import '../styles/emojiDefaults.css';

interface EmojiPanelWithFakesProps {
  securityCodeWithFakes: number[];
  onEmojiClicked: (code: number) => void;
  className?: string;
}

export const EmojiPanelWithFakes = ({securityCodeWithFakes, onEmojiClicked, className}: EmojiPanelWithFakesProps) => {
  const emojis = securityCodeWithFakes.map((code: number, index: number) => (
    <li key={`securityCodeWithFakes_${index}`}>
      <button onClick={() => onEmojiClicked(code)}>
        <Emoji code={code}/>
      </button>
    </li>
  ));

  return (
    <div className={getStyleForTopLevelComponent(className)}>
      <p>Security code</p>
      <div className="universal-login-emoji">
        <ul>
          {emojis}
        </ul>
      </div>
    </div>
  );
};
