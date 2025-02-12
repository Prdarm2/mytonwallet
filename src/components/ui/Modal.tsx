import type { RefObject } from 'react';
import type { BottomSheetKeys } from 'native-bottom-sheet';
import type { TeactNode } from '../../lib/teact/teact';
import React, { useEffect, useLayoutEffect, useRef } from '../../lib/teact/teact';

import { ANIMATION_END_DELAY, IS_EXTENSION } from '../../config';
import buildClassName from '../../util/buildClassName';
import { captureEvents, SwipeDirection } from '../../util/captureEvents';
import captureKeyboardListeners from '../../util/captureKeyboardListeners';
import { getIsSwipeToCloseDisabled } from '../../util/modalSwipeManager';
import trapFocus from '../../util/trapFocus';
import { IS_ANDROID, IS_DELEGATED_BOTTOM_SHEET, IS_TOUCH_ENV } from '../../util/windowEnvironment';
import windowSize from '../../util/windowSize';

import freezeWhenClosed from '../../hooks/freezeWhenClosed';
import { useDelegatedBottomSheet } from '../../hooks/useDelegatedBottomSheet';
import { useDelegatingBottomSheet } from '../../hooks/useDelegatingBottomSheet';
import { useDeviceScreen } from '../../hooks/useDeviceScreen';
import { dispatchHeavyAnimationEvent } from '../../hooks/useHeavyAnimationCheck';
import useHistoryBack from '../../hooks/useHistoryBack';
import useLang from '../../hooks/useLang';
import useShowTransition from '../../hooks/useShowTransition';

import Button from './Button';
import Portal from './Portal';

import styles from './Modal.module.scss';

type OwnProps = {
  title?: string | TeactNode;
  className?: string;
  dialogClassName?: string;
  contentClassName?: string;
  isOpen?: boolean;
  isCompact?: boolean;
  nativeBottomSheetKey?: BottomSheetKeys;
  forceFullNative?: boolean; // Always open in "full" size
  noResetFullNativeOnBlur?: boolean; // Don't reset "full" size on blur
  forceBottomSheet?: boolean;
  noBackdrop?: boolean;
  noBackdropClose?: boolean;
  header?: any;
  hasCloseButton?: boolean;
  children: React.ReactNode;
  onClose: () => void;
  onCloseAnimationEnd?: () => void;
  onEnter?: () => void;
  dialogRef?: RefObject<HTMLDivElement>;
};

export const CLOSE_DURATION = 350;
export const CLOSE_DURATION_PORTRAIT = IS_ANDROID ? 200 : 500;

function Modal({
  dialogRef,
  title,
  className,
  dialogClassName,
  contentClassName,
  isOpen,
  isCompact,
  nativeBottomSheetKey,
  forceFullNative,
  forceBottomSheet,
  noResetFullNativeOnBlur,
  noBackdrop,
  noBackdropClose,
  header,
  hasCloseButton,
  children,
  onClose,
  onCloseAnimationEnd,
  onEnter,
}: OwnProps): TeactJsx {
  const lang = useLang();
  // eslint-disable-next-line no-null/no-null
  const modalRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line no-null/no-null
  const localDialogRef = useRef<HTMLDivElement>(null);
  dialogRef ||= localDialogRef;

  const { isPortrait } = useDeviceScreen();

  const animationDuration = isPortrait ? CLOSE_DURATION_PORTRAIT : CLOSE_DURATION;
  const { shouldRender, transitionClassNames } = useShowTransition(
    isOpen,
    onCloseAnimationEnd,
    undefined,
    false,
    undefined,
    animationDuration + ANIMATION_END_DELAY,
  );

  const isSlideUp = !isCompact && isPortrait;

  useHistoryBack({
    isActive: isOpen,
    onBack: onClose,
  });

  useEffect(
    () => (isOpen ? captureKeyboardListeners({
      onEnter,
      onEsc: (e: KeyboardEvent) => {
        if (IS_EXTENSION) {
          e.preventDefault();
        }

        onClose();
      },
    }) : undefined),
    [isOpen, onClose, onEnter],
  );
  useEffect(() => (isOpen && modalRef.current ? trapFocus(modalRef.current) : undefined), [isOpen]);

  useLayoutEffect(() => (
    isOpen ? dispatchHeavyAnimationEvent(animationDuration + ANIMATION_END_DELAY) : undefined
  ), [animationDuration, isOpen]);

  useEffect(() => {
    if (!IS_TOUCH_ENV || !isOpen || !isPortrait || !isSlideUp || IS_DELEGATED_BOTTOM_SHEET) {
      return undefined;
    }

    return captureEvents(modalRef.current!, {
      onSwipe: (e, direction) => {
        if (direction === SwipeDirection.Down && !windowSize.getIsKeyboardVisible() && !getIsSwipeToCloseDisabled()) {
          onClose();
          return true;
        }

        return false;
      },
    });
  }, [isOpen, isPortrait, isSlideUp, onClose]);

  const isDelegatingToNative = useDelegatingBottomSheet(nativeBottomSheetKey, isPortrait, isOpen, onClose);
  useDelegatedBottomSheet(
    nativeBottomSheetKey, isOpen, onClose, dialogRef, forceFullNative, noResetFullNativeOnBlur,
  );

  if (!shouldRender) {
    return undefined;
  }

  function renderHeader() {
    if (header) {
      return header;
    }

    if (!title) {
      return undefined;
    }

    return (
      <div
        className={buildClassName(styles.header, styles.header_wideContent, !hasCloseButton && styles.header_noClose)}
      >
        <div className={styles.title}>{title}</div>
        {hasCloseButton && (
          <Button isRound className={styles.closeButton} ariaLabel={lang('Close')} onClick={onClose}>
            <i className={buildClassName(styles.closeIcon, 'icon-close')} aria-hidden />
          </Button>
        )}
      </div>
    );
  }

  const fullClassName = buildClassName(
    styles.modal,
    className,
    transitionClassNames,
    isSlideUp && styles.slideUpAnimation,
    isCompact && styles.compact,
    forceBottomSheet && styles.forceBottomSheet,
    isDelegatingToNative && styles.delegatingToNative,
  );

  const backdropFullClass = buildClassName(styles.backdrop, noBackdrop && styles.noBackdrop);

  const contentFullClassName = buildClassName(
    styles.content,
    isCompact && styles.contentCompact,
    'custom-scroll',
    contentClassName,
  );

  return (
    <Portal>
      <div ref={modalRef} className={fullClassName} tabIndex={-1} role="dialog">
        <div className={styles.container}>
          <div className={backdropFullClass} onClick={!noBackdropClose ? onClose : undefined} />
          <div
            className={buildClassName(styles.dialog, dialogClassName)}
            ref={dialogRef}
          >
            {renderHeader()}
            <div className={contentFullClassName}>{children}</div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export default freezeWhenClosed(Modal);
