{{- define "streamverse.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "streamverse.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "streamverse.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "streamverse.labels" -}}
helm.sh/chart: {{ include "streamverse.chart" . }}
{{ include "streamverse.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "streamverse.selectorLabels" -}}
app.kubernetes.io/name: {{ include "streamverse.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "streamverse.serviceLabels" -}}
{{- include "streamverse.labels" . }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{- define "streamverse.image" -}}
{{- $registry := .global.image.registry -}}
{{- $repository := .service.image.repository -}}
{{- $tag := .service.image.tag | default .global.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end }}
