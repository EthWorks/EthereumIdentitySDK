import React, {useState} from 'react';
import {Emoji} from '../commons/Emoji';
import {EMOJI_COLORS, createSequence} from '@universal-login/commons';
import {getStyleForTopLevelComponent} from '../../core/utils/getStyleForTopLevelComponent';
import '../styles/emoji.css';
import '../styles/emojiDefaults.css';
import '../styles/colors.css';

const BATCH_SIZE = 32;

interface EmojiKeyboardProps {
  onEmojiClick: (code: number) => void;
  className?: string;
}

export const EmojiKeyboard = ({onEmojiClick, className}: EmojiKeyboardProps) => {
  const [colorNumber, setColorNumber] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState<number>(0);

  const renderColors = () => (
    EMOJI_COLORS.map((colorString: string, index: number) => (
      <li key={`li-color-${index}`} className="emoji-keyboard-color-item">
        <button style={{backgroundColor: colorString}} id={`btn-color-${index}`} onClick={() => setColorNumber(index)} className="emoji-keyboard-color-button" />
      </li>
    ))
  );

  const renderKeyboard = () => (
    createSequence(BATCH_SIZE).map((code: number) => {
      const emojiCode = (code + batchNumber * BATCH_SIZE) * 8 + colorNumber;
      return (
        <li key={`securityCodeWithFakes_${code}`}>
          <button id={`btn-${code}`} onClick={() => onEmojiClick(emojiCode)}>
            <Emoji code={emojiCode}/>
          </button>
        </li>
      );
    })
  );

  return (
    <div className={getStyleForTopLevelComponent(className)}>
      <div className="universal-login-emojis">
        <div className="emoji-keyboard">
          <ul className="emoji-keyboard-color-row">
            {renderColors()}
          </ul>
          <div className="emoji-keybord-row">
            <button disabled={batchNumber === 0} onClick={() => setBatchNumber(batchNumber - 1)} className="emoji-keyboard-arrow-button">
              {'<'}
            </button>
            <ul className="emojis-keyboard-batch">
                {renderKeyboard()}
            </ul>
            <button disabled={batchNumber === 3} onClick={() => setBatchNumber(batchNumber + 1)} className="emoji-keyboard-arrow-button">
              {'>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
