import { Box, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { isFirefox } from "../core/Util";
import { Vector } from "../core/Vector";
import { BottomPanelController } from "./BottomPanel";

// Adopted from https://jsfiddle.net/dandv/aFPA7

// The properties that we copy into a mirrored div.
// Note that some browsers, such as Firefox,
// do not concatenate properties, i.e. padding-top, bottom etc. -> padding,
// so we have to do every single property specifically.
const MIRROR_PROPERTIES = [
  "boxSizing",
  "width", // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  "height",
  "overflowX",
  "overflowY", // copy the scrollbar for IE

  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",

  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "lineHeight",
  "fontFamily",

  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration", // might not make a difference, but better be safe

  "letterSpacing",
  "wordSpacing"
] as const;

export function getMirrorDiv(reference: HTMLInputElement | HTMLTextAreaElement): HTMLDivElement {
  const ownerDocument = reference.ownerDocument;

  const mirror = ownerDocument.createElement("div") as HTMLDivElement;
  ownerDocument.body.appendChild(mirror);

  const mirrorStyle = mirror.style;
  const referenceStyle = getComputedStyle(reference);

  // default textarea styles
  mirrorStyle.whiteSpace = "pre-wrap";
  if (reference.nodeName !== "INPUT") mirrorStyle.wordWrap = "break-word"; // only for textarea-s

  // position off-screen
  mirrorStyle.position = "absolute"; // required to return coordinates properly
  mirrorStyle.visibility = "hidden"; // not 'display: none' because we want rendering

  // transfer the element's properties to the div
  MIRROR_PROPERTIES.forEach(prop => ((mirrorStyle as any)[prop] = (referenceStyle as any)[prop]));

  if (isFirefox()) {
    mirrorStyle.width = parseInt(referenceStyle.width) - 2 + "px"; // Firefox adds 2 pixels to the padding - https://bugzilla.mozilla.org/show_bug.cgi?id=753662
    // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
    if (reference.scrollHeight > parseInt(referenceStyle.height)) mirrorStyle.overflowY = "scroll";
  } else {
    mirrorStyle.overflow = "hidden"; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
  }

  return mirror as HTMLDivElement;
}

export function getCaretCoordinates(reference: HTMLInputElement | HTMLTextAreaElement, position: number) {
  const mirrorDiv = getMirrorDiv(reference);

  const computed = getComputedStyle(reference);

  mirrorDiv.textContent = reference.value.substring(0, position);
  // the second special handling for input type="text" vs textarea: spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
  if (reference.nodeName === "INPUT") mirrorDiv.textContent = mirrorDiv.textContent.replace(/\s/g, "\u00a0");

  var span = document.createElement("span");
  // Wrapping must be replicated *exactly*, including when a long word gets
  // onto the next line, with whitespace at the end of the line before (#7).
  // The  *only* reliable way to do that is to copy the *entire* rest of the
  // textarea's content into the <span> created at the caret position.
  // for inputs, just '.' would be enough, but why bother?
  span.textContent = reference.value.substring(position) || "."; // || because a completely empty faux span doesn't render at all
  span.style.backgroundColor = "lightgrey";
  mirrorDiv.appendChild(span);

  const coordinates = new Vector(
    span.offsetLeft + parseInt(computed["borderLeftWidth"]),
    span.offsetTop + parseInt(computed["borderTopWidth"])
  );

  mirrorDiv.remove();

  return coordinates;
}

export type AcceptedValueProps = {
  controller: BottomPanelController;
  value: string;
  current: string;
  selected: boolean;
};

export const AcceptedValue = observer((props: AcceptedValueProps) => {
  const [isHover, setIsHover] = React.useState(false);

  let bgColor: string = "transparent";
  if (props.selected && isHover) bgColor = "rgb(25 118 210 / 70%)";
  if (props.selected && !isHover) bgColor = "rgb(25 118 210 / 60%)";
  if (!props.selected && isHover) bgColor = "rgb(235 235 235 / 100%)";

  const head = props.value.substring(0, props.current.length);
  const tail = props.value.substring(props.current.length);

  return (
    <Box
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={() => {
        props.controller.insertAutoCompletionValue(props.value);
        props.controller.inputElement?.focus();
      }}
      sx={{
        padding: "0 4px",
        backgroundColor: bgColor,
        cursor: "pointer"
      }}>
      {head !== "" && (
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Ubuntu Mono",
            color: "text.primary",
            minHeight: "20px",
            lineHeight: "20px",
            display: "inline-block",
            fontWeight: 700
          }}>
          {head}
        </Typography>
      )}
      {tail !== "" && (
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Ubuntu Mono",
            color: "text.primary",
            minHeight: "20px",
            lineHeight: "20px",
            display: "inline-block"
          }}>
          {tail}
        </Typography>
      )}
    </Box>
  );
});

export const InputHintsPopup = observer((props: { controller: BottomPanelController }) => {
  const controller = props.controller;

  const mapping = controller.mapping;
  if (mapping === null) return null;

  const spec = mapping.spec;
  if (spec === null) return null;

  const currentParamValue = mapping.param?.value.value ?? "";
  const autoCompletionValues = controller.autoCompletionValues;

  const caretOffset = controller.inputElement ? getCaretCoordinates(controller.inputElement, mapping.startIndex).x : 0;

  return (
    <Box
      onMouseDown={() => (controller.isFocusedPopup = true)}
      onMouseUp={() => (controller.isFocusedPopup = false)}
      sx={{
        position: "absolute",
        left: caretOffset + "px",
        bottom: "calc(100% - 8px)",
        minWidth: "100px",
        backgroundColor: "rgb(250, 250, 250)",
        userSelect: "none"
      }}>
      {autoCompletionValues.length > 0 ? (
        <Box
          sx={{
            bottom: "calc(100% - 8px)",
            // maxHeight: "120px",
            // overflowY: "auto",
            minWidth: "100px",
            border: "1px solid rgba(0, 0, 0, 0.23)",
            borderBottom: "none"
          }}>
          {autoCompletionValues.map((val, i) => (
            <AcceptedValue
              key={i}
              controller={controller}
              value={val}
              current={currentParamValue}
              selected={controller.selected === val}
            />
          ))}
        </Box>
      ) : null}

      <Typography
        variant="body2"
        sx={{
          fontFamily: "Ubuntu Mono",
          color: "text.primary",
          minHeight: "20px",
          lineHeight: "20px",
          padding: "0 4px",
          border: "1px solid rgba(0, 0, 0, 0.23)"
        }}>
        {spec.description}
      </Typography>
    </Box>
  );
});

